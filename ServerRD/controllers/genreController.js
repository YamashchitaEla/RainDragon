import * as genreService from "../services/genreService.js";

const handleControllerError = (res, err, contextMessage) => {
    console.error(`${contextMessage}:`, err);
    const statusCode = err.statusCode || 500; 
    return res.status(statusCode).json({ 
        success: false, 
        message: err.message || "Внутрішня помилка сервера" 
    });
};

export const getGenres = async (req, res) => {
    try {
        const { id } = req.params;
        const genres = await genreService.getBookGenresById(id);
        console.log("Genres fetched for book ID in controller", id, ":", genres); // Додатковий лог для перевірки результату
        return res.status(200).json({ success: true, genres });
    } catch (err) {
        return handleControllerError(res, err, "Get Book Genres Error");
    }       
};

export const getAllGenres = async (req, res) => {
    try {
        const genres = await genreService.getAllGenres();   
        return res.status(200).json({ success: true, genres });
    } catch (err) {
        return handleControllerError(res, err, "Get All Genres Error");
    }
};
