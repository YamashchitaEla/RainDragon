import * as postService from "../services/postService.js";

export const getLatestPosts = async (req, res) => {
    try {
        const latestPosts = await postService.getLatestPostsService();
        res.json({ success: true, latestPosts });
    } catch (err) {
        res.status(500).json({ message: err.message });
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

        res.json({ success: true, posts });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

export const getAllDrafts = async (req, res) => {
    try {
        const { id } = req.params;
        const drafts = await postService.getAllDraftsService(id);

        res.json({ success: true, drafts });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

export const getPost = async (req, res) => {
    try {
        const { id } = req.params;
        const postInfo = await postService.getPostById(id);
        res.json({ success: true, postInfo });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }       
}

export const createPost = async (req, res) => {
    try {
        const { title, short_description, content, published } = req.body;
        const preview = req.file ? req.file.path : null;
        const author_id = req.user.userId;
        const tags = Array.isArray(req.body.tags)
            ? req.body.tags
            : req.body.tags
                ? [req.body.tags]
                : [];
        const newPostId = await postService.createPost(title, short_description, preview, content, author_id, published, tags);
        res.json({ success: true, postId: newPostId });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }   
}

export const updatePost = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, short_description, content, published, tags } = req.body;
        const preview = req.file; 

        await postService.updatePost(id, title, short_description, preview, content, published, tags);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const deletePost = async (req, res) => {
    try {
        const { id } = req.params;
        await postService.deletePost(id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};