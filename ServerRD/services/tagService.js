import { Tag } from "../models/Tag.js"
import { NotFoundError, BadRequestError } from "../utils/customErrors.js"; // Імпортуємо кастомні помилки

export const getPostTagsById = async (id) => {
    if (!id) {
        throw new BadRequestError("ID не визначено");
    }

    const tags = await Tag.getPostTags(id);
    if (!tags) {
        throw new NotFoundError("Теги для цієї публікації не знайдено");
    }

    return tags;
};

export const getAllTags = async () => {
    const tags = await Tag.getAllTags();
    if (!tags || tags.length === 0) {
        throw new NotFoundError("Теги в системі не знайдено");
    } 
    
    return tags;
};