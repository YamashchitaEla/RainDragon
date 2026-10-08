import * as writerService from '../services/writerService.js';

const handleControllerError = (res, err, contextMessage) => {
    console.error(`${contextMessage}:`, err);
    const statusCode = err.statusCode || 500; // Зчитуємо кастомний статус-код з сервісу, інакше 500
    return res.status(statusCode).json({ 
        success: false, 
        message: err.message || "Внутрішня помилка сервера" 
    });
};

export const getWriters = async (req, res) => {
    try {
        const writers = await writerService.getWriters();
        return res.status(200).json({ success: true, writers });
    } catch (err) {
        return handleControllerError(res, err, "Get Writers Error");
    }
};

export const getWritersByBookId = async (req, res) => {
    try {
        const bookId = req.params.id;
        const writers = await writerService.getWritersByBookId(bookId);
        return res.status(200).json({ success: true, writers });
    } catch (err) {
        return handleControllerError(res, err, "Get Writers By Book ID Error");
    }   
};

export const getWriterById = async (req, res) => {
    try {
        const { id } = req.params; 
        const writerInfo = await writerService.getWriterById(id);
        return res.status(200).json({ success: true, writerInfo });
    } catch (err) { 
        return handleControllerError(res, err, "Get Writer By ID Error");
    }
};

export const getBooksByAuthorId = async (req, res) => {
    try {
        const { id } = req.params; // Отримуємо ID автора з URL
        const books = await writerService.getBooksByAuthorId(id);
        return res.status(200).json({ success: true, books });
    } catch (err) {
        return handleControllerError(res, err, "Get Books By Author ID Error");
    }
};

export const createWriter = async (req, res) => {
    try {
        const { full_name, birthday } = req.body;
        const newWriter = await writerService.createWriter(full_name, birthday);
        
        return res.status(201).json({ 
            success: true, 
            writerId: newWriter.id
        });
    } catch (err) {
        return handleControllerError(res, err, "Create Writer Error");
    }
};

export const updateWriter = async (req, res) => {
    try {
        const { id } = req.params;
        const { full_name, birthday } = req.body;
        
        const updatedWriter = await writerService.updateWriter(id, full_name, birthday);

        return res.status(200).json({ 
            success: true, 
            writerId: updatedWriter.id 
        });
    } catch (err) {
        return handleControllerError(res, err, "Update Writer Error");
    }
};

export const deleteWriter = async (req, res) => {
    try {
        const { id } = req.params;
        await writerService.deleteWriter(id);
        return res.status(200).json({ success: true, id }); // Повертаємо ID для легкого видалення зі стейту на фронтенді
    } catch (err) {
        return handleControllerError(res, err, "Delete Writer Error");
    }
};