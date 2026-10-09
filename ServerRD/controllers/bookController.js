import * as bookService from "../services/bookService.js";
import { handleControllerError } from '../utils/errorHandler.js';

export const getLatestBooks = async (req, res) => {
    try {
        const latestBooks = await bookService.getLatestBooksService();
        
        return res.status(200).json({ 
            success: true, 
            latestBooks 
        });
    } catch (err) {
        return handleControllerError(res, err, "Get Latest Books Error");
    }       
};

export const getTopBooks = async (req, res) => {
    try {
        const topBooks = await bookService.getTopBooksService();
        
        return res.status(200).json({ 
            success: true, 
            topBooks 
        });
    } catch (err) {
        return handleControllerError(res, err, "Get Top Books Error");
    }
};

export const getAllBooks = async (req, res) => {
    try {
        const { genres } = req.query;
        let books;
        
        if (genres) {
            const genreIds = genres.split(",").map(Number);
            
            books = await bookService.getBooksByGenresService(genreIds);
        } else {
            books = await bookService.getAllBooksService();
        }

        return res.status(200).json({ 
            success: true, 
            books 
        });
    } catch (err) {
        return handleControllerError(res, err, "Get All Books Error");
    }
};

export const getBook = async (req, res) => {
    try {
        const { id } = req.params;

        const bookInfo = await bookService.getBookById(id);

        return res.status(200).json({ 
            success: true, 
            bookInfo 
        });
    } catch (err) {
        return handleControllerError(res, err, "Get Book Error");
    }       
};

export const createBook = async (req, res) => {
    try {
        const { original_name, ukrainian_name, year, status, volumes, chapters, extras, description } = req.body;

        const preview = req.files?.preview ? req.files.preview[0] : null;

        const authors = Array.isArray(req.body.authors)
            ? req.body.authors
            : req.body.authors ? [req.body.authors] : [];

        const genres = Array.isArray(req.body.genres)
            ? req.body.genres
            : req.body.genres ? [req.body.genres] : [];
        
        const newBook = await bookService.createBook(
            original_name, 
            ukrainian_name, 
            year, 
            status, 
            volumes, 
            chapters, 
            extras, 
            description, 
            preview, 
            authors, 
            genres
        );

        return res.status(201).json({ 
            success: true, 
            bookId: newBook.id 
        });
    } catch (err) {
        return handleControllerError(res, err, "Create Book Error");
    }
};

export const updateBook = async (req, res) => {
    try {
        const { id } = req.params;
        const { original_name, ukrainian_name, year, status, volumes, chapters, extras, description } = req.body;
        
        const preview = req.files?.preview ? req.files.preview[0] : null;

        const authors = Array.isArray(req.body.authors)
            ? req.body.authors
            : req.body.authors ? [req.body.authors] : [];

        const genres = Array.isArray(req.body.genres)
            ? req.body.genres
            : req.body.genres ? [req.body.genres] : [];
        
        const updatedBook = await bookService.updateBook(
            id, 
            original_name, 
            ukrainian_name, 
            year, 
            status, 
            volumes, 
            chapters, 
            extras, 
            description, 
            preview, 
            authors, 
            genres
        );

        return res.status(200).json({ 
            success: true, 
            bookId: updatedBook.id 
        });
    } catch (err) {
        return handleControllerError(res, err, "Update Book Error");
    }
};

export const deleteBook = async (req, res) => {
    try {
        const { id } = req.params;

        await bookService.deleteBook(id);

        return res.status(200).json({ 
            success: true 
        });
    } catch (err) {
        return handleControllerError(res, err, "Delete Book Error");
    }
};

export const getWatchlist = async (req, res) => {
    try {
        const { user_id, book_id } = req.params;
        
        const watchlist = await bookService.getWatchlist(user_id, book_id);
        
        return res.status(200).json({ 
            success: true, 
            watchlist 
        });
    } catch (err) {
        return handleControllerError(res, err, "Get Watchlist Error");
    }       
};

export const updateWatchlist = async (req, res) => {
    try {
        const { user_id, book_id, status } = req.body;
        
        await bookService.updateWatchlist(user_id, book_id, status); 
        
        return res.status(200).json({ 
            success: true 
        });
    } catch (err) {
        return handleControllerError(res, err, "Update Watchlist Error");
    }   
};

export const getWatchlistByUserId = async (req, res) => {
    try {
        const { id } = req.params;
        
        const watchlist = await bookService.getWatchlistByUserId(id);
        
        return res.status(200).json({ 
            success: true, 
            watchlist 
        });
    } catch (err) {
        return handleControllerError(res, err, "Get Watchlist By User ID Error");
    }       
};

export const getRating = async (req, res) => {
    try {
        const { user_id, book_id } = req.params;
        
        const rating = await bookService.getRating(user_id, book_id);
        
        return res.status(200).json({ 
            success: true, 
            rating 
        });
    } catch (err) {
        return handleControllerError(res, err, "Get Rating Error");
    }
};

export const updateRating = async (req, res) => {
    try {
        const { user_id, book_id, rate } = req.body;
        
        const averageRating = await bookService.updateRating(user_id, book_id, rate);
        
        return res.status(200).json({ 
            success: true, 
            rating: averageRating 
        });
    } catch (err) {
        return handleControllerError(res, err, "Update Rating Error");
    }
};
