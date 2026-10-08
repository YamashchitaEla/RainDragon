import { Genre } from "../models/Genre.js";
import { NotFoundError, BadRequestError } from "../utils/customErrors.js"; // Імпортуємо кастомні помилки

export const getBookGenresById = async (id) => {
    if (!id) {
        throw new BadRequestError("ID не визначено");
    }
    const genres = await Genre.getBookGenres(id);
    console.log("Genres fetched for book ID", id, ":", genres); // Додатковий лог для перевірки результату

    if (!genres || genres.length === 0) {
        throw new NotFoundError("Жанри для цієї книги не знайдено");
    }

    return genres;
};

export const getAllGenres = async () => {
    const genres = await Genre.getAllGenres();
    
    if (!genres || genres.length === 0) {
        throw new NotFoundError("Жанри в системі не знайдено");
    }   
    return genres;
};
