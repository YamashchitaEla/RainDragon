import { pool } from "../db/db.js";

export class Post {
    constructor(data) {
        const {
            id = null,
            title = null,
            short_description = null,
            preview = null,
            content = null,
            created_at = null,
            updated_at = null,
            author = null,
            published = null
        } = data || {};

        Object.assign(this, { id, title, short_description, preview, content, created_at, updated_at, author, published });
    }

    // Отримання останніх 10 публікацій
    static async getLatestPosts() {
        const result = await pool.query(
            `SELECT 
                p.id, p.title, p.short_description, p.preview, p.published, p.updated_at,
                JSON_BUILD_OBJECT('id', u.id, 'nickname', u.nickname) AS author -- Додано автора для відображення на фронтенді
            FROM post AS p 
            JOIN "user" AS u ON p.author_id = u.id
            WHERE p.published = true
            ORDER BY p.updated_at DESC, p.id DESC
            LIMIT 10`
        );

        return result.rows.map(row => new Post(row));
    }

    // Отримання всіх публікацій
    static async getAllPosts() {
        const result = await pool.query(
            `SELECT 
                p.id, p.title, p.short_description, p.preview, p.published, p.updated_at,
                JSON_BUILD_OBJECT('id', u.id, 'nickname', u.nickname) AS author -- Додано автора
            FROM post AS p 
            JOIN "user" AS u ON p.author_id = u.id
            WHERE p.published = true
            ORDER BY p.updated_at DESC, p.id DESC`
        );

        return result.rows.map(row => new Post(row));
    }

    // Отримання чернеток
    static async getAllDrafts(id) {
        const result = await pool.query(
            `SELECT 
                p.id, p.title, p.short_description, p.preview, p.published, p.updated_at,
                JSON_BUILD_OBJECT('id', u.id, 'nickname', u.nickname) AS author
            FROM post AS p 
            JOIN "user" AS u ON p.author_id = u.id
            WHERE p.author_id = $1 AND p.published = false
            ORDER BY p.updated_at DESC, p.id DESC`, 
            [id]
        );

        return result.rows.map(row => new Post(row));
    }
        
    // Отримання публікацій за тегами
    static async getPostsByTags(tagIds) {
        if (!tagIds || tagIds.length === 0) {
            return [];
        }

        const result = await pool.query(
            `SELECT
                p.id, p.title, p.short_description, p.preview, p.published, p.created_at,
                JSON_BUILD_OBJECT('id', u.id, 'nickname', u.nickname) AS author
            FROM post p
            JOIN "user" AS u ON p.author_id = u.id
            WHERE p.id IN (
                SELECT post_id
                FROM tag_list
                WHERE tag_id = ANY($1::int[])
                GROUP BY post_id
                HAVING COUNT(DISTINCT tag_id) = $2
            ) AND p.published = true
            ORDER BY p.updated_at DESC, p.id DESC`, 
            [tagIds, tagIds.length]
        );

        return result.rows.map(row => new Post(row));
    }

    // Детальна інформація про публікацію
    static async getPostInfoById(id) {
        const result = await pool.query(
            `SELECT 
                p.*,
                JSON_BUILD_OBJECT('id', u.id, 'nickname', u.nickname) AS author
            FROM post AS p
            JOIN "user" AS u ON p.author_id = u.id
            WHERE p.id = $1`, 
            [id]
        );

        return result.rows[0] ? new Post(result.rows[0]) : null;
    }

    static async createPost(title, short_description, preview, content, author_id, published) {
        const result = await pool.query(
            `INSERT INTO post (title, short_description, preview, content, author_id, published) 
            VALUES ($1, $2, $3, $4, $5, $6) 
            RETURNING *`,
            [title, short_description, preview, content, author_id, published]
        );

        return result.rows[0] ? new Post(result.rows[0]) : null;
    }
 
    static async updatePost(id, { title, short_description, preview, content, published }) {
        const values = [title, short_description, preview, content, published, id];
        const query = `
            UPDATE post
            SET
                title = COALESCE($1, title),
                short_description = COALESCE($2, short_description),
                preview = COALESCE($3, preview),
                content = COALESCE($4, content),
                published = COALESCE($5, published),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $6
            RETURNING *;
        `;

        const result = await pool.query(query, values);

        return result.rows[0] ? new Post(result.rows[0]) : null;
    }

    static async deletePost(id) {
        await pool.query(`DELETE FROM post WHERE id = $1`, [id]);
    }
}
