import { google } from 'googleapis';
import { Readable } from 'stream';

// Налаштування авторизації (дані з вашого JSON-ключа Google Cloud)
const auth = new google.auth.GoogleAuth({
    keyFile: './google-drive-key.json', // шлях до вашого ключа
    scopes: ['https://www.googleapis.com/auth/drive.file'],
});

const drive = google.drive({ version: 'v3', auth });

export const uploadFile = async (fileObject, folderId, newFileName) => {
    try {
        // Перетворюємо буфер з Multer у потік (stream)
        const bufferStream = new Readable();
        bufferStream.push(fileObject.buffer);
        bufferStream.push(null);

        const response = await drive.files.create({
            requestBody: {
                name: newFileName, // Назва файлу (наприклад, "101.jpg")
                parents: [folderId], // ID папки призначення
            },
            media: {
                mimeType: fileObject.mimetype,
                body: bufferStream,
            },
            fields: 'id, webViewLink', // Повертаємо ID та публічне посилання
        });

        // ВАЖЛИВО: Робимо файл публічним для читання
        await drive.permissions.create({
            fileId: response.data.id,
            requestBody: {
                role: 'reader',
                type: 'anyone',
            },
        });

        // Повертаємо пряме посилання (або webViewLink)
        return response.data.webViewLink; 
    } catch (error) {
        console.error('Drive Upload Error:', error);
        throw new Error('Помилка завантаження на Google Drive');
    }
};