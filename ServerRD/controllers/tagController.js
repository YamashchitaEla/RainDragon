import * as tagService from "../services/tagService.js";

export const getTags = async (req, res) => {
    try {
        const { id } = req.params;
        const tags = await tagService.getPostTagsById(id);
        res.json({ success: true, tags});
    } catch (err) {
        res.status(500).json({ message: err.message });
    }       
}

export const getAllTags = async (req, res) => {
    try {
        const tags = await tagService.getAllTags();
        res.json({ success: true, tags });
    } catch (err) {
        res.status(500).json({ message: err.message }); 
    }
}