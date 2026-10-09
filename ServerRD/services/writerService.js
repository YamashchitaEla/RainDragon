import { Writer } from "../models/Writer.js";
import { NotFoundError, BadRequestError } from "../utils/customErrors.js"; // Імпортуємо кастомні помилки

export const getWriters = () => Writer.getAllWriters();

export const getWritersByBookId = (bookId) => {
    if (!bookId) {
        throw new BadRequestError("ID книги не визначено");
    }

    return Writer.getWriterByBookId(bookId);
};

export const getWriterById = async (id) => {
    if (!id) {
        throw new BadRequestError("ID не вказано");
    }
    
    const writer = await Writer.getWriterById(id);
    if (!writer) {
        throw new NotFoundError("Письменника з таким ID не знайдено");
    }

    return writer;
};

export const getBooksByAuthorId = async (authorId) => {
    if (!authorId) {
        throw new BadRequestError("ID автора не визначено");
    }

    return await Writer.getBooksByAuthor(authorId);
};

export const createWriter = async (full_name, birthday) => {
    if (!full_name?.trim() || !birthday?.trim()) {
        throw new BadRequestError("Відсутні обов'язкові поля");
    }

    return await Writer.create(full_name, birthday);
};

export const updateWriter = async (id, full_name, birthday) => {
    if (!id) {
        throw new BadRequestError("ID не визначено");
    }

    const updatedWriter = await Writer.update(
        id, 
        {full_name, birthday}
    );
    
    if (!updatedWriter) {
        throw new NotFoundError("Письменника для оновлення не знайдено");
    }

    return updatedWriter;
};

export const deleteWriter = async (id) => {
    if (!id) {
        throw new BadRequestError("ID не визначено");
    }
    
    const writer = await Writer.getWriterById(id);
    if (!writer) {
        throw new NotFoundError("Письменника для видалення не знайдено");
    }
    
    await Writer.delete(id);
};
