import { pool } from "../db/db.js";

export class Genre {
    // DTO - Data Transfer Object. Безпечна деструктуризація для фільтрації та нормалізації даних
    constructor(data) {
        const {
            id = null,
            genre = null
        } = data || {};
        Object.assign(this, { id, genre });
    }

    static async getBookGenres(id) {
        const result = await pool.query(
            `SELECT g.id, g.genre 
            FROM book AS b 
            JOIN genre_list AS gl ON b.id = gl.book_id 
            JOIN genre AS g ON gl.genre_id = g.id 
            WHERE b.id = $1`, 
            [id]
        );
        console.log("getBookGenres result:", result.rows); // Додатковий лог для перевірки результату
        return result.rows.map(row => new Genre(row));
    }

    static async getAllGenres() {
        const result = await pool.query(
            `SELECT id, genre 
            FROM genre`
        );
        return result.rows.map(row => new Genre(row));
    }
    
    static async addGenresToBook(bookId, genres) {
        if (!genres || genres.length === 0) {
            return;
        }
        const values = [];
        const valueStrings = genres.map((genreId, index) => {
            values.push(bookId, genreId); 
            const baseIndex = index * 2; // Крок по 2, бо у нас два значення на кожен жанр (book_id і genre_id)
            return `($${baseIndex + 1}, $${baseIndex + 2})`;
        }).join(", ");

        const query = `INSERT INTO genre_list (book_id, genre_id) VALUES ${valueStrings}`;
    
        await pool.query(query, values);
    }

    static async updateGenresOfBook(bookId, genres) {
        if (!genres || genres.length === 0) {
            await pool.query(`DELETE FROM genre_list WHERE book_id = $1`, [bookId]);
            return;
        }
        
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Спочатку видаляємо всі поточні зв'язки
            await client.query(`DELETE FROM genre_list WHERE book_id = $1`, [bookId]);
            
            // Потім додаємо нові зв'язки через динамічний SQL
            const values = [];
            const valueStrings = genres.map((genreId, index) => {
                values.push(bookId, genreId);
                const baseIndex = index * 2; // Крок по 2, бо у нас два значення на кожен жанр (book_id і genre_id)
                return `($${baseIndex + 1}, $${baseIndex + 2})`;
            }).join(", ");

            const query = `INSERT INTO genre_list (book_id, genre_id) VALUES ${valueStrings}`;
            await client.query(query, values);

            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK'); // Відкат змін у разі системного збою
            throw error;
        } finally {
            client.release(); // Обов'язкове звільнення клієнта назад у пул
        }
    }
}