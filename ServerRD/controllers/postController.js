import * as postService from "../services/postService.js";
import { handleControllerError } from '../utils/errorHandler.js';

export const getLatestPosts = async (req, res) => {
    try {
        const latestPosts = await postService.getLatestPostsService();
        
        return res.status(200).json({ 
            success: true, 
            latestPosts 
        });
    } catch (err) {
        return handleControllerError(res, err, "Get Latest Posts Error");
    }       
}

export const getAllPosts = async (req, res) => {
    try {
        const { tags } = req.query;
        let posts;
        
        if (tags) {
            const tagIds = tags.split(",").map(Number);

            posts = await postService.getPostsByTagsService(tagIds);
        } else {
            posts = await postService.getAllPostsService();
        }
        
        return res.status(200).json({ 
            success: true, 
            posts 
        });
    } catch (err) {
        return handleControllerError(res, err, "Get All Posts Error");
    }
}

export const getAllDrafts = async (req, res) => {
    try {
        const { id } = req.params;
        
        const drafts = await postService.getAllDraftsService(id);
        
        return res.status(200).json({ 
            success: true, 
            drafts 
        });
    } catch (err) {
        return handleControllerError(res, err, "Get All Drafts Error");
    }
}

export const getPost = async (req, res) => {
    try {
        const { id } = req.params;
        
        const postInfo = await postService.getPostById(id);
        
        return res.status(200).json({ 
            success: true, 
            postInfo 
        });
    } catch (err) {
        return handleControllerError(res, err, "Get Post Error");
    }       
}

export const createPost = async (req, res) => {
    try {
        const { title, short_description, content, published } = req.body;
        
        const preview = req.file || null;
        
        const author_id = req.user.userId;
        
        const tags = Array.isArray(req.body.tags)
            ? req.body.tags
            : req.body.tags ? [req.body.tags] : [];

        const newPost = await postService.createPost(
            title, 
            short_description, 
            preview, 
            content, 
            author_id, 
            published, 
            tags
        );

        return res.status(201).json({ 
            success: true, 
            postId: newPost.id 
        });
    } catch (err) {
        return handleControllerError(res, err, "Create Post Error");
    }   
}

export const updatePost = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, short_description, content, published } = req.body;
        
        const preview = req.file || null;

        const tags = Array.isArray(req.body.tags)
            ? req.body.tags
            : req.body.tags ? [req.body.tags] : [];

        const updatedPost = await postService.updatePost(
            id, 
            title,
            short_description, 
            preview, 
            content, 
            published, 
            tags
        );

        return res.status(200).json({ 
            success: true, 
            postId: updatedPost.id 
        });
    } catch (err) {
        return handleControllerError(res, err, "Update Post Error");
    }
};

export const deletePost = async (req, res) => {
    try {
        const { id } = req.params;
        
        await postService.deletePost(id);

        return res.status(200).json({ 
            success: true 
        });
    } catch (err) {
        return handleControllerError(res, err, "Delete Post Error");
    }
};