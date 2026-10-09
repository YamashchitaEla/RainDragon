/**
 * Універсальна функція для обробки помилок у контроллерах
 * @param {Object} res - Об'єкт відповіді Express (Response)
 * @param {Error} err - Об'єкт помилки
 * @param {string} contextMessage - Контекстне повідомлення для логування в консоль
 */
export const handleControllerError = (res, err, contextMessage) => {
    console.error(`${contextMessage}:`, err);
    
    // Читаємо кастомний статус, інакше 500
    const statusCode = err.statusCode || 500; 
    
    return res.status(statusCode).json({ 
        success: false, 
        message: err.message || "Внутрішня помилка сервера" 
    });
};
