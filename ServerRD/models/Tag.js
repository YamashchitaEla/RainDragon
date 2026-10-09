import { pool } from "../db/db.js";

export class Tag {
    // DTO - Data Transfer Object. Безпечна деструктуризація для фільтрації та нормалізації даних
    constructor(data) {
        const {
            id = null,
            tag = null
        } = data || {};

        Object.assign(this, { id, tag });
    }

    static async getPostTags (id) {
        const result = await pool.query(
            `SELECT t.id, t.tag 
            FROM post AS p 
            JOIN tag_list AS tl ON p.id = tl.post_id 
            JOIN tag AS t ON tl.tag_id = t.id 
            WHERE p.id = $1`, 
            [id]
        );

        return result.rows.map(row => new Tag(row));
    }

    static async getAllTags() {
        const result = await pool.query(
            `SELECT id, tag 
            FROM tag`
        );

        return result.rows.map(row => new Tag(row));
    }

    static async addTagsToPost(postId, tags) {
        if (!tags || tags.length === 0) {
            return;
        }

        const values = [];
        const valueStrings = tags.map((tagId, index) => {
            values.push(postId, tagId);
            const baseIndex = index * 2; // Крок по 2 параметри на кожну ітерацію
            return `($${baseIndex + 1}, $${baseIndex + 2})`;
        }).join(", ");

        const query = `INSERT INTO tag_list (post_id, tag_id) VALUES ${valueStrings}`;
        
        await pool.query(query, values);
    }

    static async updateTagsOfPost(postId, tags) {
        if (!tags || tags.length === 0) {
            await pool.query(`DELETE FROM tag_list WHERE post_id = $1`, [postId]);
            return;
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Спочатку видалити всі поточні зв'язки
            await client.query(`DELETE FROM tag_list WHERE post_id = $1`, [postId]);
            
            // Додати нові зв'язки через динамічний SQL
            const values = [];
            const valueStrings = tags.map((tagId, index) => {
                values.push(postId, tagId);
                const baseIndex = index * 2;
                return `($${baseIndex + 1}, $${baseIndex + 2})`;
            }).join(", ");

            const query = `INSERT INTO tag_list (post_id, tag_id) VALUES ${valueStrings}`;
            
            await client.query(query, values);

            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release(); // Обов'язкове звільнення клієнта 
        }
    }
}