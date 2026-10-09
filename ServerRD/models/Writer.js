import { pool } from "../db/db.js";
import { Book } from "./Book.js";

export class Writer {
    constructor(data) {
        const {
            id = null,
            full_name = null,
            birthday = null
        } = data || {};
        
        Object.assign(this, { id, full_name, birthday });
    }

    static async getAllWriters() {
        const result = await pool.query(
            `SELECT id, full_name, birthday::TEXT 
            FROM writer`
        );

        return result.rows.map(row => new Writer(row));
    }

    static async getWriterById(id) {
        const result = await pool.query(
            `SELECT id, full_name, birthday::TEXT 
            FROM writer 
            WHERE id = $1`, 
            [id]
        );

        return result.rows[0] ? new Writer(result.rows[0]) : null;
    }

    static async getWriterByBookId(bookId) {
        const result = await pool.query(
            `SELECT w.id, w.full_name, w.birthday::TEXT
            FROM writer w
            JOIN writer_list wl ON w.id = wl.writer_id
            JOIN book b ON wl.book_id = b.id
            WHERE b.id = $1`, 
            [bookId]
        );

        return result.rows.map(row => new Writer(row));
    }

    static async getBooksByAuthor(writerId) {
        const result = await pool.query(
            `SELECT b.id, 
                b.ukrainian_name, 
                b.preview, 
                JSON_AGG(JSON_BUILD_OBJECT('id', w.id, 'full_name', w.full_name)) AS author
            FROM book b
            JOIN writer_list wl ON b.id = wl.book_id
			JOIN writer w ON wl.writer_id = w.id
            WHERE wl.writer_id = $1
			GROUP BY b.id, b.ukrainian_name, b.preview`, 
            [writerId]
        );

        return result.rows.map(row => (new Book(row)));
    }

    static async addAuthorToBook(bookId, writers) {
        if (!writers || writers.length === 0) {
            return;
        }

        const values = [];
        const valueStrings = writers.map((writerId, index) => {
            values.push(bookId, writerId); 
            const baseIndex = index * 2; // Крок по 2, бо два значення на кожен жанр (book_id і genre_id)
            return `($${baseIndex + 1}, $${baseIndex + 2})`;

        }).join(", ");

        // Використати динамічний SQL для вставки всіх авторів за один запит
        const query = `INSERT INTO writer_list (book_id, writer_id) VALUES ${valueStrings}`;
        
        await pool.query(query, values);
    }

    static async updateAuthorsOfBook(bookId, writers) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            await client.query(`DELETE FROM writer_list WHERE book_id = $1`, [bookId]);
            
            if (writers && writers.length > 0) {
                const values = [];
                const valueStrings = writers.map((writerId, index) => {
                    values.push(bookId, writerId); 
                    const baseIndex = index * 2;
                    return `($${baseIndex + 1}, $${baseIndex + 2})`;
                }).join(", ");

                const query = `INSERT INTO writer_list (book_id, writer_id) VALUES ${valueStrings}`;
                
                await client.query(query, values);
            }

            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    static async create(full_name, birthday) {
        const result = await pool.query(
            `INSERT INTO writer (full_name, birthday) 
            VALUES ($1, $2) 
            RETURNING id, full_name, birthday::TEXT`, 
            [full_name, birthday]
        );

        return result.rows[0] ? new Writer(result.rows[0]) : null;
    }

    static async update(id, { full_name, birthday }) {
        const values = [full_name, birthday, id];
        // COALESCE бере перше значення, яке не є NULL і ставить його (тобто старе), якщо не надійшло нове
        const query = `
            UPDATE writer
            SET
                full_name = COALESCE($1, full_name),
                birthday = COALESCE($2, birthday)
            WHERE id = $3
            RETURNING id, full_name, birthday::TEXT
        `;

        const result = await pool.query(query, values);

        return result.rows[0] ? new Writer(result.rows[0]) : null;
    }

    static async delete(id) {
        await pool.query(
            `DELETE FROM writer 
            WHERE id = $1`, 
            [id]
        );
    }
}

