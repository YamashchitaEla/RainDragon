import { Book } from "../models/Book.js";
import { Writer } from "../models/Writer.js";
import { Genre } from "../models/Genre.js";
import { NotFoundError, BadRequestError, AppError } from "../utils/customErrors.js";
import { deleteFileFromCloudinary } from "../utils/cloudinaryHelper.js";

// Просто передаємо далі
export const getLatestBooksService = () => Book.getLatestBooks(); // повертаємо масив останніх книг

export const getTopBooksService = () => Book.getTopBooks(); // повертаємо масив топових книг

export const getAllBooksService = () => Book.getAllBooks(); 

export const getBooksByGenresService = (genreIds) => {
    if (!genreIds || genreIds.length === 0) {
        throw new BadRequestError("Не вказано жодного жанру для фільтрації");
    }
    return Book.getBooksByGenres(genreIds);
};

export const getBookById = async (id) => {
    if (!id) {
        throw new BadRequestError("ID не визначено");
    }

    const book = await Book.getBookInfoById(id);

    if (!book) {
        throw new NotFoundError("Книгу не знайдено");
    }

    return book;
};

export const createBook = async (original_name, ukrainian_name, year, status, volumes, chapters, extras, description, previewFile, authors, genres) => {
    // Перевірка текстових та числових полів
    const isBasicFieldsEmpty = !original_name || !ukrainian_name || !year || !status || !description || !previewFile;

    // Перевірка масивів
    const isAuthorsEmpty = !authors || authors.length === 0;
    const isGenresEmpty = !genres || genres.length === 0;

    if (isBasicFieldsEmpty || isAuthorsEmpty || isGenresEmpty) {
        throw new BadRequestError("Відсутні обов'язкові поля або не обрано жодного автора/жанру");
    }

    // Достаємо шлях до прев'ю (обкладинки), оскільки модель очікує рядок
    const previewUrl = previewFile.path;

    const newBook = await Book.createBook(
        original_name, 
        ukrainian_name, 
        year, 
        status, 
        volumes || null, 
        chapters || null, 
        extras || null, 
        description, 
        previewUrl
    );

    // Перевіряємо, чи повернувся створений об'єкт із ID
    if (!newBook || !newBook.id) {
        throw new AppError("Не вдалося створити сутність книги в базі даних", 500);
    }

    // Зв'язуємо авторів та жанри через ID, отриманий з DTO-об'єкта книги
    await Writer.addAuthorToBook(newBook.id, authors);
    await Genre.addGenresToBook(newBook.id, genres);

    return newBook;
};

export const updateBook = async (id, original_name, ukrainian_name, year, status, volumes, chapters, extras, description, previewFile, authors, genres) => {
    if (!id) {
        throw new BadRequestError("ID не визначено");
    }

    // Перевірка обов'язкових полів
    const isBasicFieldsEmpty = !original_name || !ukrainian_name || !year || !status || !description;
    const isAuthorsEmpty = !authors || authors.length === 0;
    const isGenresEmpty = !genres || genres.length === 0;

    if (isBasicFieldsEmpty || isAuthorsEmpty || isGenresEmpty) {
        throw new BadRequestError("Відсутні обов'язкові поля або не обрано жодного автора/жанру");
    }

    // Повне каскадне видалення пов'язаних медіа-файлів перед стиранням запису з БД
    const currentBook = await Book.getBookInfoById(id);
    if (!currentBook) {
        throw new NotFoundError("Книгу для оновлення не знайдено");
    }

    let previewPath = undefined;

    if (previewFile) {
        previewPath = previewFile.path;
        try {
            // Видаляємо старе прев'ю з Cloudinary
            await deleteFileFromCloudinary(currentBook.preview);
        } catch (err) {
            console.error("Не вдалося видалити старе прев'ю з Cloudinary:", err);
        }
    }

    const updatedBook = await Book.updateBook(
        id,
        {original_name, ukrainian_name, year, status, volumes, chapters, extras, description, preview: previewPath}
    );
        
    await Writer.updateAuthorsOfBook(id, authors);
    await Genre.updateGenresOfBook(id, genres);

    return updatedBook;
};

export const deleteBook = async (id) => {
    if (!id) {
        throw new BadRequestError("ID не визначено");
    }

    //Повне каскадне видалення пов'язаних медіа-файлів перед стиранням запису з БД
    const book = await Book.getBookInfoById(id);
    if (book) {
        try {
            await deleteFileFromCloudinary(book.preview);
        } catch (err) {
            console.error("Не вдалося видалити прев'ю книги з Cloudinary:", err);
        }
    }
    await Book.deleteBook(id);
};

export const getWatchlist = async (user_id, book_id) => {
    if (!user_id || !book_id) {
        throw new BadRequestError("ID користувача або книги не визначено");
    }
    const watchlist = await Book.getWatchlistStatus(user_id, book_id);
    if (!watchlist) {
        return null;
    }
    return watchlist;
};

export const updateWatchlist = async (user_id, book_id, status) => {
    if (!user_id || !book_id) {
        throw new BadRequestError("ID користувача або книги не визначено");
    }
    await Book.updateWatchlistStatus(user_id, book_id, status);
};

export const getWatchlistByUserId = async (id) => {
    if (!id) {
        throw new BadRequestError("ID користувача не визначено");
    }
    return await Book.getWatchlistByUserId(id);
};

export const getRating = async (user_id, book_id) => {
    if (!user_id || !book_id) {
        throw new BadRequestError("ID користувача або книги не визначено");
    }
    return await Book.getRating(user_id, book_id);
};

export const updateRating = async (user_id, book_id, rate) => {
    if (!user_id || !book_id) {
        throw new BadRequestError("ID користувача або книги не визначено");
    }
    return await Book.updateRating(user_id, book_id, rate);
};
