import { Tag } from "../models/Tag.js"
import "dotenv/config";

export const getPostTagsById = async (id) => {
    if (!id) {
        throw new Error("ID не визначено");
    }
    const tags = await Tag.getPostTags(id);

    if (!tags) {
        throw new Error("Теги не знайдено");
    }

    return tags;
};

export const getAllTags = async () => {
    const tags = await Tag.getAllTags();
    if (!tags) {
        throw new Error("Теги не знайдено");
    }
    return tags;
};