import { Post } from "../models/Post.js"
import { Tag } from "../models/Tag.js";
import { NotFoundError, BadRequestError, AppError } from "../utils/customErrors.js";
import { deleteFileFromCloudinary } from "../utils/cloudinaryHelper.js";

export const getLatestPostsService = () => Post.getLatestPosts(); // повертаємо масив останніх постів

export const getAllPostsService = () => Post.getAllPosts(); 

export const getPostsByTagsService = (tagIds) => Post.getPostsByTags(tagIds);

export const getAllDraftsService = async (id) => {
    if (!id) {
        throw new BadRequestError("ID не визначено");
    }

    const drafts = await Post.getAllDrafts(id);
    if (!drafts) {
        throw new NotFoundError("Публікації не знайдено");
    }

    return drafts;
};

export const getPostById = async (id) => {
    if (!id) {
        throw new BadRequestError("ID не визначено");
    }

    const post = await Post.getPostInfoById(id);
    if (!post) {
         throw new NotFoundError("Публікацію не знайдено");
    }

    return post;
};

export const createPost = async (title, short_description, preview, content, author_id, published, tags) => {
    // Перевірка обов'язкових полів
    const isBasicFieldsEmpty = !title || !short_description || !preview || !content || !author_id || published === undefined;
    const isTagsEmpty = !tags || tags.length === 0;
    
    if (isBasicFieldsEmpty || isTagsEmpty) {
        throw new BadRequestError("Відсутні обов'язкові поля або не обрано жодного тега");
    }

    // Шлях до прев'ю (обкладинки), оскільки модель очікує рядок
    const previewUrl = preview.path;

    const newPost = await Post.createPost(
        title, 
        short_description, 
        previewUrl, 
        content, 
        author_id, 
        published
    );

    if (!newPost || !newPost.id) {
        throw new AppError("Не вдалося створити сутність публікації в базі даних", 500);
    }

    await Tag.addTagsToPost(newPost.id, tags);
    
    return newPost;
}

export const updatePost = async (id, title, short_description, preview, content, published, tags) => {
    if (!id) {
        throw new BadRequestError("ID не визначено");
    }

    // Перевірка обов'язкових полів
    const isBasicFieldsEmpty = !title || !short_description || !content || published === undefined;
    const isTagsEmpty = !tags || tags.length === 0;
    
    if (isBasicFieldsEmpty || isTagsEmpty) {
        throw new BadRequestError("Відсутні обов'язкові поля або не обрано жодного тега");
    }

    // Повне каскадне видалення пов'язаних медіа-файлів перед стиранням запису з БД
    const currentPost = await Post.getPostInfoById(id);
    if (!currentPost) {
        throw new NotFoundError("Публикацію для оновлення не знайдено");
    }

    let previewPath = undefined;

    if (preview) {
        previewPath = preview.path;
        try {
            // Видалення старого прев'ю з Cloudinary
            await deleteFileFromCloudinary(currentPost.preview);
        } catch (err) {
            console.error("Не вдалося видалити старе прев'ю з Cloudinary:", err);
        }
    }

    const updatedPost = await Post.updatePost(
        id,
        {title, short_description, content, preview: previewPath, published}
    );

    await Tag.updateTagsOfPost(id, tags);

    return updatedPost;
}   

export const deletePost = async (id) => {
    if (!id) {
        throw new BadRequestError("ID не визначено");
    }

    //Повне каскадне видалення пов'язаних медіа-файлів перед стиранням запису з БД
    const post = await Post.getPostInfoById(id);
    if (post) {
        try {
            await deleteFileFromCloudinary(post.preview);
        } catch (err) {
            console.error("Не вдалося видалити прев'ю книги з Cloudinary:", err);
        }
    }

    await Post.deletePost(id);
}