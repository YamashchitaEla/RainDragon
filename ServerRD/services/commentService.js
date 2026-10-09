import { Comment } from "../models/Comment.js";
import { NotFoundError, BadRequestError } from "../utils/customErrors.js"; // Імпортуємо кастомні помилки

function buildTree(comments) {
    const map = {};
    const roots = [];

    // Кожний коментар записуємо
    comments.forEach(c => {
        map[c.id] = { ...c, replies: [] };
    });

    // Для кожного коментаря, якщо parent_id != null
    comments.forEach(c => {
        if (c.parent_id) {
            map[c.parent_id]?.replies.push(map[c.id]);
        } else {
            roots.push(map[c.id]);
        }
    });

    return roots;
}

export const getBookCommentsById = async (id) => {
    if (!id) {
        throw new BadRequestError("ID не визначено");
    }
    const comments = await Comment.getBookComments(id);
    return buildTree(comments);
};

export const getPostCommentsById = async (id) => {
    if (!id) {
        throw new BadRequestError("ID не визначено");
    }
    const comments = await Comment.getPostComments(id);
    return buildTree(comments);
};

export const addComment = async ({ parent_id, author_id, book_id, post_id, text }) => {
    if (!author_id || !text?.trim()) {
        throw new BadRequestError("Невірні дані для коментаря (відсутній текст або автор)");
    }
    return await Comment.addComment({ parent_id, author_id, book_id, post_id, text });
};

export const deleteCommentById = async (id) => {
    if (!id) {
        throw new BadRequestError("ID не визначено");
    }
    await Comment.deleteComment(id);
};

export const updateCommentById = async (id, text) => {
    if (!id || !text?.trim()) {
        throw new BadRequestError("ID або текст не визначено");
    }
    
    const updatedComment = await Comment.updateComment(id, text);
    
    if (!updatedComment) {
        throw new NotFoundError("Коментар для оновлення не знайдено");
    }
    
    return updatedComment;
};