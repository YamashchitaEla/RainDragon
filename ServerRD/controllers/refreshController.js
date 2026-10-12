import { rotateRefreshSession } from "../services/refreshSessionService.js";
import { COOKIE_NAME, cookieOptions, clearRefreshCookie} from "../utils/cookieOptions.js";
import { handleControllerError } from "../utils/errorHelper.js";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";

export const refresh = async (req, res) => {
    try {
        const oldRefreshToken = req.cookies?.[COOKIE_NAME];
        if (!oldRefreshToken) {
            return res.status(401).json({
                success: false,
                message: "No refresh token"
            });
        }

        // Перевірити підпис і термін дії старого токена
        const decoded = jwt.verify(
            oldRefreshToken,
            process.env.REFRESH_SECRET
        );

        // Створюємо нову пару токенів
        const newAccessToken = jwt.sign(
            {
                userId: decoded.userId,
                admin: decoded.admin
            },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        const newRefreshToken = jwt.sign(
            {
                userId: decoded.userId,
                admin: decoded.admin,
                jti: randomUUID() // Ідентифікатор
            },
            process.env.REFRESH_SECRET,
            { expiresIn: "7d" }
        );

        // Старий токен відкликається, новий зберігається
        // в межах однієї транзакції PostgreSQL
        const rotation = await rotateRefreshSession(
            oldRefreshToken,
            newRefreshToken,
            decoded.userId
        );

        if (!rotation.ok) {
            clearRefreshCookie(res);
            return res.status(401).json({
                success: false,
                message: rotation.reuseDetected
                    ? "Виявлено повторне використання токена оновлення. Будь ласка, увійдіть знову."
                    : "Сеанс оновлення недійсний або термін його дії минув."
            });
        }

        res.cookie(
            COOKIE_NAME,
            newRefreshToken,
            cookieOptions(rotation.rememberMe)
        );

        return res.status(200).json({
            success: true,
            accessToken: newAccessToken,
            rememberMe: rotation.rememberMe
        });
    } catch (err) {
        clearRefreshCookie(res);

        if (err.name === "TokenExpiredError" || err.name === "JsonWebTokenError") {
            return res.status(401).json({
                success: false,
                message: "Refresh token is invalid or expired"
            });
        }

        return handleControllerError(
            res,
            err,
            "Refresh Token Error"
        );
    }
};