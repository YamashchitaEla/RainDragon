import { pool } from "../db/db.js";

export class Book {
    constructor(data) {
        const {
            id = null,
            original_name = null,
            ukrainian_name = null,
            year = null,
            status = null,
            volumes = null,
            chapters = null,
            extras = null,
            description = null,
            preview = null,
            updated_at = null,
            rating = null,
            watchlist_status = null,
            author = []
        } = data || {};
        Object.assign(this, { id, original_name, ukrainian_name, year, status, volumes, chapters, extras, description, preview, updated_at, author, rating, watchlist_status });
    }

    // Отримання останніх 3 книг
    static async getLatestBooks() {
        const result = await pool.query(`
            SELECT 
                b.id, 
                b.ukrainian_name, 
                b.preview,
				b.updated_at,
                JSON_AGG(JSON_BUILD_OBJECT('id', w.id, 'full_name', w.full_name)) AS author
            FROM book AS b 
            JOIN writer_list wl ON b.id = wl.book_id 
            JOIN writer AS w ON wl.writer_id = w.id 
            GROUP BY b.id, b.ukrainian_name, b.preview, b.updated_at 
            ORDER BY b.updated_at DESC, b.id DESC
            LIMIT 5;`
        );
        return result.rows.map(row => new Book(row));
    }

    // Отримання популярніхк книг
    static async getTopBooks() {
        const result = await pool.query(`
            SELECT
                b.id,
                b.ukrainian_name,
                b.preview,
                COALESCE(AVG(r.rate), 0) AS rating,
                JSON_AGG(DISTINCT JSONB_BUILD_OBJECT('id', w.id,'full_name', w.full_name)) AS author
            FROM book b
            JOIN writer_list wl ON wl.book_id = b.id
            JOIN writer w ON w.id = wl.writer_id
            LEFT JOIN rating r ON r.book_id = b.id
            GROUP BY b.id, b.ukrainian_name, b.preview
            ORDER BY rating DESC
            LIMIT 5;`
        );
        return result.rows.map(row => new Book(row));
    }

    // Отримання всіх книг
    static async getAllBooks() {
        const result = await pool.query(`
            SELECT 
                b.id, 
                b.ukrainian_name, 
                b.preview,
                JSON_AGG(JSON_BUILD_OBJECT('id', w.id, 'full_name', w.full_name)) AS author
            FROM book AS b 
            JOIN writer_list wl ON b.id = wl.book_id 
            JOIN writer AS w ON wl.writer_id = w.id 
            GROUP BY b.id, b.ukrainian_name, b.preview;`
        );
        return result.rows.map(row => new Book(row));
    }

    // Отримання книг за жанрами
    static async getBooksByGenres(genreIds) {
        const result = await pool.query(`
            SELECT
                b.id,
                b.ukrainian_name,
                b.preview,
                JSON_AGG(DISTINCT JSONB_BUILD_OBJECT('id', w.id, 'full_name', w.full_name)) AS author
            FROM book b
            JOIN writer_list wl ON wl.book_id = b.id
            JOIN writer w ON w.id = wl.writer_id
            WHERE b.id IN (
                SELECT book_id
                FROM genre_list
                WHERE genre_id = ANY($1::int[])
                GROUP BY book_id
                HAVING COUNT(DISTINCT genre_id) = $2
            )
            GROUP BY b.id, b.ukrainian_name, b.preview;`, 
            [genreIds, genreIds.length]
        );
        return result.rows.map(row => new Book(row));
    }

    // Детальна інформація про книгу
    static async getBookInfoById(id) {
        const result = await pool.query(`
            SELECT 
                b.*, 
                JSON_AGG(JSON_BUILD_OBJECT('id', w.id, 'full_name', w.full_name)) AS author 
            FROM book AS b 
            JOIN writer_list wl ON b.id = wl.book_id 
            JOIN writer AS w ON wl.writer_id = w.id 
            WHERE b.id = $1 
            GROUP BY b.id`, 
            [id]
        );
        return result.rows[0] ? new Book(result.rows[0]) : null;
    }

    // Отримання списку "Планую прочитати" для користувача
    static async getWatchlistByUserId(userId) {
        const result = await pool.query(`
            SELECT 
                b.id, 
                b.ukrainian_name, 
                b.preview, 
                wl.status AS watchlist_status, 
                JSON_AGG(JSON_BUILD_OBJECT('id', w.id, 'full_name', w.full_name)) AS author 
            FROM watch_list wl 
            JOIN book b ON wl.book_id = b.id 
            JOIN writer_list wl2 ON b.id = wl2.book_id 
            JOIN writer w ON wl2.writer_id = w.id 
            WHERE wl.user_id = $1 
            GROUP BY b.id, b.ukrainian_name, b.preview, wl.status`, 
            [userId]
        );

        // Тут ми повертаємо об'єкти, які включають масив авторів
        return result.rows.map(row => new Book(row));
    }

    static async createBook(original_name, ukrainian_name, year, status, volumes, chapters, extras, description, preview) {
        const result = await pool.query(
            `INSERT INTO book (original_name, ukrainian_name, year, status, volumes, chapters, extras, description, preview) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
            RETURNING id`, 
            [original_name, ukrainian_name, year, status, volumes, chapters, extras, description, preview]);
        return new Book(result.rows[0]);
    }

    static async updateBook(id, { original_name, ukrainian_name, year, status, volumes, chapters, extras, description, preview }) {
        const values = [original_name, ukrainian_name, year, status, volumes, chapters, extras, description, preview, id];
        // COALESCE бере перше значення, яке не є NULL і ставить його (тобто старе), якщо не надійшло нове
        const query = `
            UPDATE book
            SET
                original_name = COALESCE($1, original_name),
                ukrainian_name = COALESCE($2, ukrainian_name),
                year = COALESCE($3, year),
                status = COALESCE($4, status),
                volumes = COALESCE($5, volumes),
                chapters = COALESCE($6, chapters),
                extras = COALESCE($7, extras),
                description = COALESCE($8, description),
                preview = COALESCE($9, preview),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $10
            RETURNING id, original_name, ukrainian_name, year, status, volumes, chapters, extras, description, preview, updated_at`;
        const result = await pool.query(query, values);
        return result.rows[0] ? new Book(result.rows[0]) : null;
    }

    static async deleteBook(id) {
        await pool.query(
            `DELETE FROM book WHERE id = $1`, 
            [id]
        );
    }

    static async getWatchlistStatus(user_id, book_id) {
        const result = await pool.query(
            `SELECT status 
            FROM watch_list 
            WHERE user_id = $1 AND book_id = $2`, 
            [user_id, book_id]
        );
        return result.rows[0];
    }

    static async updateWatchlistStatus(user_id, book_id, status) {
        const query = `
            INSERT INTO watch_list (user_id, book_id, status) 
            VALUES ($1, $2, $3) 
            ON CONFLICT (user_id, book_id) 
            DO UPDATE SET status = EXCLUDED.status;
        `;
        await pool.query(query, [user_id, book_id, status]);
    }

    static async getRating(user_id, book_id) {
        const result = await pool.query(
            `SELECT
                (
                    SELECT rate
                    FROM rating
                    WHERE user_id = $1 AND book_id = $2
                ) AS user_rating,
                (
                    SELECT AVG(rate)
                    FROM rating
                    WHERE book_id = $2
                ) AS average_rating
            `,
            [user_id, book_id]
        );
        return result.rows[0];
    }

    static async updateRating(user_id, book_id, rate) {
        if (rate === 0) {
            await pool.query(
                `DELETE FROM rating 
                WHERE user_id = $1 AND book_id = $2`, 
                [user_id, book_id]
            );
            return; 
        }

        const query = `
            INSERT INTO rating (user_id, book_id, rate) 
            VALUES ($1, $2, $3) 
            ON CONFLICT (user_id, book_id) 
            DO UPDATE SET rate = EXCLUDED.rate;
        `;
        await pool.query(query, [user_id, book_id, rate]);
    }
}