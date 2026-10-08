import * as commentService from "../services/commentService.js";

const handleControllerError = (res, err, contextMessage) => {
    console.error(`${contextMessage}:`, err);
    const statusCode = err.statusCode || 500; // Зчитуємо кастомний статус-код з сервісу, інакше 500
    return res.status(statusCode).json({ 
        success: false, 
        message: err.message || "Внутрішня помилка сервера" 
    });
};

export const getBookComments = async (req, res) => {
    try {
        const { id } = req.params;
        const comments = await commentService.getBookCommentsById(id);
        return res.status(200).json({ 
            success: true, 
            comments 
        });
    } catch (err) {
        return handleControllerError(res, err, "Get Book Comments Error");
    }       
};

export const getPostComments = async (req, res) => {
    try {
        const { id } = req.params;
        const comments = await commentService.getPostCommentsById(id);
        return res.status(200).json({ 
            success: true, 
            comments 
        });
    } catch (err) {
        return handleControllerError(res, err, "Get Post Comments Error");
    }       
};

export const createComment = async (req, res) => {
    try {
        const { parent_id, author_id, book_id, post_id, text } = req.body;
        const comment = await commentService.addComment({ parent_id, author_id, book_id, post_id, text });
        return res.status(201).json({ 
            success: true, 
            comment 
        }); 
    } catch (err) {
        return handleControllerError(res, err, "Create Comment Error");
    }
};

export const deleteComment = async (req, res) => {
    try {
        const { id } = req.params;
        await commentService.deleteCommentById(id);
        return res.status(200).json({ 
            success: true, 
            id 
        }); 
    } catch (err) {
        return handleControllerError(res, err, "Delete Comment Error");
    }
};


export const updateComment = async (req, res) => {
    try {        
        const { id } = req.params;
        const { text } = req.body;
        
        const updatedComment = await commentService.updateCommentById(id, text);
        
        return res.status(200).json({ 
            success: true, 
            comment: updatedComment 
        });
    } catch (err) {
        return handleControllerError(res, err, "Update Comment Error");
    }   
};