import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

// Конфігурація Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Налаштування сховища
// Він зупиняє виконання основного коду контролера.
// Multer починає викачувати файл із тіла запиту.
// Multer не просто бере файл, а одразу переправляє його в хмару Cloudinary.
// Очікування: Express чекає, поки Cloudinary відповість: "Окей, я зберіг файл, ось посилання: https://...".
// Запис даних: Після успішного завантаження Multer додає в об'єкт запиту (req) нове поле — file.
// req.file.path — тепер містить пряме посилання на картинку.
// req.body — містить текстові поля (назву книги, автора тощо).

// Сховище для аватарок
const storage_avatars = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'users_avatars',
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
        transformation: [{ width: 300, height: 300, crop: 'thumb', gravity: 'face' }] // Краще для аватарок
    },
});

// Сховище для книг
const storage_books = new CloudinaryStorage({
    cloudinary: cloudinary,

    params: async (req, file) => {
        if (file.fieldname === "preview") {
            return {
                folder: "books_previews",
                resource_type: "image",
                allowed_formats: ["jpg", "png", "jpeg", "webp"],
                transformation: [
                    {
                        width: 500,
                        height: 750,
                        crop: "limit"
                    }
                ]
            };
        }

        if (file.fieldname === "text") {
            return {
                folder: "books_texts",
                resource_type: "raw"
            };
        }

        throw new Error(`Невідоме поле файлу: ${file.fieldname}`);
    }
});

// Сховище для обкладинок публикацій 
const storage_posts_previews = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'posts_previews',
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
        transformation: [{ width: 700, height: 1000, crop: 'limit' }]
    },
});

// Інстанси multer
export const uploadAvatar = multer({ storage: storage_avatars });
export const uploadBook = multer({ storage: storage_books });
export const uploadPostPreview = multer({ storage: storage_posts_previews });