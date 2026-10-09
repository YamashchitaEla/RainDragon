import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Routes from "./routes/Routes.js";
import cookieParser from 'cookie-parser';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

dotenv.config();

const app = express();

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true 
}));
app.use(express.json());
app.use(cookieParser());

// Підключаємо маршрути
app.use("/api", Routes);

// Помилки
app.use((err, req, res, next) => {
    console.error("========== SERVER ERROR ==========");
    console.error("name:", err?.name);
    console.error("message:", err?.message);
    console.error("stack:", err?.stack);
    console.error("full error:", err);

    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal server error"
    });
});

app.listen(5000, () => console.log("Server running on port 5000"));