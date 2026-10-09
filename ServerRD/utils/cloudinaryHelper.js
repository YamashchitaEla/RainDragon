import { v2 as cloudinary } from "cloudinary";

/**
 * Універсальна функція для безпечного видалення файлів з Cloudinary
 * @param {string} url - Пряме посилання на файл з бази даних
 * @param {string} [resourceType="image"] - Тип ресурсу ("image" для картинок, "raw" для epub/pdf)
 */
export const deleteFileFromCloudinary = async (url, resourceType = "image") => {
    // Якщо посилання немає (наприклад, у книги спочатку не було тексту), просто виходимо
    if (!url) {
        return;
    }

    // Перевірка на системний дефолтний аватар
    if (url.includes("default_user_zkhfkg")) {
        console.log("[Cloudinary Clean] Пропуск: Системний дефолтний аватар не видаляється.");
        return;
    }

    try {
        // Розбиття посилання по слешах на масив
        const urlParts = url.split('/');

        // Дістати останній елемент (ім'я файлу з розширенням): "14_h1h9bv.jpg"
        const fileNameWithExtension = urlParts.pop(); 

        // Взіти чисте ім'я файлу до крапки: "14_h1h9bv"
        const fileName = fileNameWithExtension.split('.')[0]; 

        // Дістати передостанній елемент (назву папки або службове слово 'upload')
        const folderOrUpload = urlParts.pop(); 

        // Фінальна склейка Public ID: 
        // Якщо перед файлом йшло 'upload' — папки в URL немає, взяти просто ім'я файлу
        // Якщо там назва папки (наприклад, users_avatars) — склеїти їх разом
        const filePublicId = folderOrUpload === 'upload' 
            ? fileName 
            : `${folderOrUpload}/${fileName}`;

        // Надіслати запит на видалення в Cloudinary з урахуванням типу ресурсу
        const result = await cloudinary.uploader.destroy(filePublicId, { resource_type: resourceType });
        
        console.log(`[Cloudinary Clean] Файл ${filePublicId} успішно видалено. Статус:`, result);
    } catch (err) {
        // Не викидати помилку далі (throw), щоб збій у хмарі не ламав основну роботу бази даних
        console.error(`[Cloudinary Error] Не вдалося видалити файл з URL: ${url}. Помилка:`, err);
    }
};