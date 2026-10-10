import express from "express";
import multer from "multer";
import { login } from "../controllers/authController.js";
import { register } from "../controllers/authController.js";
import { refresh } from "../controllers/authController.js";
import { logout } from "../controllers/authController.js";
import { getUserById } from "../controllers/userController.js";
import { updateProfile } from "../controllers/userController.js";
import * as bookController from "../controllers/bookController.js";
import * as postController from "../controllers/postController.js";
import * as genreController from "../controllers/genreController.js";
import * as commentController from "../controllers/commentController.js"
import * as writerController from "../controllers/writerController.js";
import * as tagController from "../controllers/tagController.js";
import * as contactsController from "../controllers/contactsController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { uploadAvatar, uploadBook, uploadPostPreview } from "../middleware/upload.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// --------------- AUTH ---------------
router.post("/login", login);
router.post("/register", register);
router.post("/refresh", refresh);
router.post("/logout", logout);

// --------------- BOOKS ---------------
router.get("/books_latest", bookController.getLatestBooks);
router.get("/books_top", bookController.getTopBooks);
router.get("/books", bookController.getAllBooks);
router.get("/watchlist/user/:id", authMiddleware, bookController.getWatchlistByUserId);
router.get("/watchlist/:user_id/:book_id", authMiddleware, bookController.getWatchlist);
router.get("/rating/:user_id/:book_id", authMiddleware, bookController.getRating);
router.get("/book/:id", bookController.getBook);

router.post("/book/create", authMiddleware, uploadBook.fields([
        { name: "preview", maxCount: 1 },
        { name: "text", maxCount: 1 }]), 
        bookController.createBook);
router.post("/watchlist/update", authMiddleware, bookController.updateWatchlist);
router.post("/rating/update", authMiddleware, bookController.updateRating);

router.put("/book/update/:id", authMiddleware, uploadBook.fields([
        { name: "preview", maxCount: 1 },
        { name: "text", maxCount: 1 }]), 
        bookController.updateBook);

router.delete("/book/delete/:id", authMiddleware, bookController.deleteBook);

// --------------- POSTS ---------------
router.get("/posts_latest", postController.getLatestPosts);
router.get("/posts", postController.getAllPosts);
router.get("/posts/drafts/:id", authMiddleware, postController.getAllDrafts);
router.get("/post/:id", postController.getPost);

router.post("/post/create", authMiddleware, uploadPostPreview.single("preview"), postController.createPost);

router.put("/post/update/:id", authMiddleware, uploadPostPreview.single("preview"), postController.updatePost);

router.delete("/post/delete/:id", authMiddleware, postController.deletePost);

// --------------- WRITERS ---------------
router.get("/writers", writerController.getWriters);
router.get("/books/writer/:id", writerController.getBooksByAuthorId);
router.get("/writers/:id", writerController.getWritersByBookId);
router.get("/writer/:id", writerController.getWriterById);

// formData розрахована на надсилання файлів, вказуємо їх відсутність
router.post("/writer/create", authMiddleware, upload.none(), writerController.createWriter);

router.put("/writer/update/:id", authMiddleware, upload.none(), writerController.updateWriter);

router.delete("/writer/delete/:id", authMiddleware, writerController.deleteWriter);

// --------------- USERS ---------------
router.get("/users/:id", authMiddleware, getUserById);

router.put("/user/update/:id", authMiddleware, uploadAvatar.single("avatar"), updateProfile);

// --------------- COMMENTS ---------------
router.get("/comments/book/:id", commentController.getBookComments);
router.get("/comments/post/:id", commentController.getPostComments);

router.post("/comments", authMiddleware, commentController.createComment);

router.put("/comments/:id", authMiddleware, commentController.updateComment);

router.delete("/comments/:id", authMiddleware, commentController.deleteComment);

// --------------- GENRES ---------------
router.get("/genres", genreController.getAllGenres)
router.get("/genres/:id", genreController.getGenres);

// --------------- TAGS ---------------
router.get("/tags", tagController.getAllTags);
router.get("/tags/:id", tagController.getTags);

//  --------------- CONTACTS ---------------
router.post("/contacts", contactsController.sendMail);

export default router;