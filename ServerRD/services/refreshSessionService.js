import crypto from "node:crypto";
import { pool } from "../db/db.js";

export const hashRefreshToken = (token) => {
    return crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
};

// Створення refresh-сесії після входу або реєстрації
export const createRefreshSession = async (userId, refreshToken, rememberMe) => {
    const tokenHash = hashRefreshToken(refreshToken);

    const decoded = JSON.parse(Buffer.from(refreshToken.split(".")[1], "base64url").toString());

    const expiresAt = new Date(decoded.exp * 1000);

    await pool.query(
        `INSERT INTO refresh_sessions
            (user_id, token_hash, expires_at, remember_me)
         VALUES ($1, $2, $3, $4)`,
        [userId, tokenHash, expiresAt, rememberMe]
    );
};

// Ротація: відкликати старий токен і зберегти новий
export const rotateRefreshSession = async (oldRefreshToken, newRefreshToken, userId) => {
    const client = await pool.connect();
    let transactionStarted = false;

    try {
        await client.query("BEGIN");
        transactionStarted = true;

        const oldHash = hashRefreshToken(oldRefreshToken);
        const newHash = hashRefreshToken(newRefreshToken);

        // Обираємо старий токен та блокуємо на транзакцію
        const result = await client.query(
            `SELECT id, user_id, expires_at, revoked_at, remember_me
             FROM refresh_sessions
             WHERE token_hash = $1
             FOR UPDATE`,
            [oldHash]
        );

        const session = result.rows[0];
        // Якщо сесія відсутня, або не збігається id 
        if (!session || Number(session.user_id) !== Number(userId)) {
            await client.query("ROLLBACK");
            transactionStarted = false;
            return { 
                ok: false 
            };
        }

        // Повторне використання вже відкликаного токена (revoked_at)
        if (session.revoked_at) {
            // Відкликати всі існуючі сесії
            await client.query(
                `UPDATE refresh_sessions
                 SET revoked_at = NOW()
                 WHERE user_id = $1
                   AND revoked_at IS NULL`,
                [userId]
            );

            await client.query("COMMIT");
            transactionStarted = false;

            return {
                ok: false,
                reuseDetected: true
            };
        }

        // Якщо дата завершення токену менша за поточну
        if (new Date(session.expires_at) <= new Date()) {
            await client.query("ROLLBACK");
            transactionStarted = false;
            return { 
                ok: false 
            };
        }

        // Відкликати старий токен, ставимо новий хеш
        //id	    token_hash	revoked_at	replaced_by_hash
1	    //hash_A	час         відкликання	hash_B
2	    //hash_B	NULL	    NULL
        const updated = await client.query(
            `UPDATE refresh_sessions
            SET revoked_at = NOW(), replaced_by_hash = $2
            WHERE id = $1 AND revoked_at IS NULL`,
            [session.id, newHash]
        );

        if (updated.rowCount !== 1) {
            await client.query("ROLLBACK");
            transactionStarted = false;
            return { 
                ok: false 
            };
        }

        const decoded = JSON.parse(Buffer.from(newRefreshToken.split(".")[1],"base64url").toString());
        const newExpiresAt = new Date(decoded.exp * 1000);
        await client.query(
            `INSERT INTO refresh_sessions (user_id, token_hash, expires_at, remember_me)
            VALUES ($1, $2, $3, $4)`,
            [ userId, newHash, newExpiresAt, session.remember_me ]
        );

        await client.query("COMMIT");
        transactionStarted = false;

        return {
            ok: true,
            rememberMe: session.remember_me
        };
    } catch (error) {
        if (transactionStarted) {
            await client.query("ROLLBACK");
        }

        throw error;
    } finally {
        client.release();
    }
};

// Відкликання конкретної сесії
export const revokeRefreshSession = async (refreshToken) => {
    const tokenHash = hashRefreshToken(refreshToken);

    const result = await pool.query(
        `UPDATE refresh_sessions
        SET revoked_at = NOW()
        WHERE token_hash = $1 AND revoked_at IS NULL
        RETURNING id`,
        [tokenHash]
    );

    return result.rowCount > 0;
}; 