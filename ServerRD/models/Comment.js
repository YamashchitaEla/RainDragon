import { pool } from "../db/db.js";

export class Comment {
    // DTO - Data Transfer Object. Слугує для передачі даних між шарами додатку.
    constructor(data) {
        // Деструктуризація об'єкта data з дефолтними значеннями
        const { 
            id = null, 
            parent_id = null, 
            author_id = null, 
            book_id = null, 
            post_id = null, 
            date = new Date(), 
            text = "", 
            nickname = "Аноним", 
            avatar = null 
        } = data || {};

        Object.assign(this, { id, parent_id, author_id, book_id, post_id, date, text, nickname, avatar });
    }

    static async getBookComments(bookId) {
        const result = await pool.query(
            `SELECT c.id, c.parent_id, c.author_id, c.book_id, c.post_id, c.date, c.text, u.nickname, u.avatar 
            FROM comment c 
            JOIN "user" u ON c.author_id = u.id 
            WHERE c.book_id = $1 
            ORDER BY c.date ASC`, 
            [bookId]
        );

        return result.rows.map(row => new Comment(row));
    }

    static async getPostComments(postId) {
        const result = await pool.query(
            `SELECT c.id, c.parent_id, c.author_id, c.book_id, c.post_id, c.date, c.text, u.nickname, u.avatar 
            FROM comment c 
            JOIN "user" u ON c.author_id = u.id 
            WHERE c.post_id = $1 
            ORDER BY c.date ASC`,
            [postId]
        );
        
        return result.rows.map(row => new Comment(row));
    }

    static async addComment({ parent_id, author_id, book_id, post_id, text }) {
        const query = `
            WITH inserted_comment AS (
                INSERT INTO comment (parent_id, author_id, book_id, post_id, text) 
                VALUES ($1, $2, $3, $4, $5) 
                RETURNING *
            )
            SELECT ic.*, u.nickname, u.avatar 
            FROM inserted_comment ic
            JOIN "user" u ON ic.author_id = u.id;`;
        
        const values = [parent_id, author_id, book_id, post_id, text];
        const result = await pool.query(query, values);
        
        return result.rows[0] ? new Comment(result.rows[0]) : null;
    }

    static async deleteComment(id) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            await client.query(`DELETE FROM comment WHERE parent_id = $1`, [id]);
            await client.query(`DELETE FROM comment WHERE id = $1`, [id]);
            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    static async updateComment(id, text) {
        const query = 
        `WITH updated_comment AS (
            UPDATE comment 
            SET text = $1 
            WHERE id = $2
            RETURNING *
        )
        SELECT uc.*, u.nickname, u.avatar 
        FROM updated_comment uc
        JOIN "user" u ON uc.author_id = u.id;`;
        
        const result = await pool.query(query, [text, id]);

        return result.rows[0] ? new Comment(result.rows[0]) : null;
    }
}