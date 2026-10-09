import * as tagService from "../services/tagService.js";
import { handleControllerError } from '../utils/errorHandler.js';

export const getTags = async (req, res) => {
    try {
        const { id } = req.params;

        const tags = await tagService.getPostTagsById(id);
        
        return res.status(200).json({ 
            success: true, 
            tags 
        });
    } catch (err) {
        return handleControllerError(res, err, "Get Post Tags Error");
    }       
}

export const getAllTags = async (req, res) => {
    try {
        const tags = await tagService.getAllTags();
        
        return res.status(200).json({ 
            success: true, 
            tags 
        });
    } catch (err) {
        return handleControllerError(res, err, "Get All Tags Error");
    }
}