import { pool } from "../db/db.js";

export class User {
    constructor(data) {
        const { 
            id = null,
            nickname = null,
            about = null, 
            login = null, 
            password = null, 
            admin = null, 
            avatar = null 
        } = data || {};

        Object.assign(this, { id, nickname, about, login, password, admin, avatar });
    }

    static async findByLogin(login) {
        const result = await pool.query(
            `SELECT id, nickname, login, password, admin 
            FROM "user" 
            WHERE login = \$1`, 
            [login]
        );
        // Якщо користувач(елемент масиву) не знайдений - undefined, тому перевірка
        return result.rows[0] ? new User(result.rows[0]) : null;
    }

    static async findById(id) {
        const result = await pool.query(
            `SELECT id, nickname, about, login, password, admin, avatar 
            FROM "user" 
            WHERE id = \$1`, 
            [id]);
        return result.rows[0] ? new User(result.rows[0]) : null;
    }

    static async create({ nickname, login, password }) {
        const result = await pool.query(
            `INSERT INTO "user" (nickname, login, password, admin) 
                VALUES ($1, $2, $3, $4) 
            RETURNING *`,
            [nickname, login, password, false]
        );
        return new User(result.rows[0]);
    }

    static async update(id, { nickname, about, avatar }) {
        const values = [nickname, about, avatar, id];
        // Додаємо RETURNING в кінці запиту
        // Якщо $1 не NULL — постав $1? інакше старе
        const query = `
        UPDATE "user" 
        SET 
            nickname = COALESCE($1, nickname), 
            about = COALESCE($2, about), 
            avatar = COALESCE($3, avatar) 
        WHERE id = $4
        RETURNING *;`;

        const result = await pool.query(query, values);
        
        return result.rows[0] ? new User(result.rows[0]) : null;
    }
}