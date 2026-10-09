import { Post } from "../models/Post.js"
import { Tag } from "../models/Tag.js";
import "dotenv/config";

// Просто передаємо далі
export const getLatestPostsService = () => Post.getLatestPosts(); // повертаємо масив останніх постів

export const getAllPostsService = () => Post.getAllPosts(); 

export const getPostsByTagsService = (tagIds) => Post.getPostsByTags(tagIds);

export const getAllDraftsService = async (id) => {
    if (!id) {
        throw new Error("ID не визначено");
    }
    const drafts = await Post.getAllDrafts(id);

    if (!drafts) {
        throw new Error("Пост не знайдено");
    }

    return drafts;
};

export const getPostById = async (id) => {
    if (!id) {
        throw new Error("ID не визначено");
    }
    const post = await Post.getPostInfoById(id);

    if (!post) {
        throw new Error("Пост не знайдено");
    }

    return post;
};

export const createPost = async (title, short_description, preview, content, author_id, published, tags) => {
    // Перевірка текстових та числових полів
    const isBasicFieldsEmpty = !title || !short_description || !preview || !content || !author_id || published === undefined;

    // Перевірка масивів: чи вони існують ТА чи вони не порожні
    const isTagsEmpty = !tags || tags.length === 0;

    if (isBasicFieldsEmpty || isTagsEmpty) {
        throw new Error("Відсутні обов'язкові поля або не обрано жодного тега");
    }

    // Якщо все добре, створюємо пост
    const newPostId = await Post.createPost(title, short_description, preview, content, author_id, published);
    const result = await Tag.addTagsToPost(newPostId, tags);
    
    return newPostId;
}

export const updatePost = async (id, title, short_description, preview, content, published, tags) => {
    if (!id) throw new Error("ID не визначено");
    
    // Формуємо об'єкт для оновлення. 
    // Якщо файл є - беремо шлях з Cloudinary, якщо ні - undefined (COALESCE в моделі спрацює)
    const updateData = {
        title,
        short_description,
        content,
        preview: preview ? preview.path : undefined,
        published 
    };

    await Post.updatePost(id, updateData);
    await Tag.updateTagsOfPost(id, tags);
}   

export const deletePost = async (id) => {
    if (!id) {
        throw new Error("ID не визначено");
    }
    await Post.deletePost(id);
}