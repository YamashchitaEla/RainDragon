import * as genreService from "../services/genreService.js";
import { handleControllerError } from '../utils/errorHandler.js';

export const getGenres = async (req, res) => {
    try {
        const { id } = req.params;
        
        const genres = await genreService.getBookGenresById(id);
        
        return res.status(200).json({ 
            success: true, 
            genres 
        });
    } catch (err) {
        return handleControllerError(res, err, "Get Book Genres Error");
    }       
};

export const getAllGenres = async (req, res) => {
    try {
        const genres = await genreService.getAllGenres();   
        
        return res.status(200).json({ 
            success: true, 
            genres 
        });
    } catch (err) {
        return handleControllerError(res, err, "Get All Genres Error");
    }
};
