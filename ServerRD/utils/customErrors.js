export class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class BadRequestError extends AppError {
    // Маємо повідомлення за замовчуванням, але можемо передати своє
    constructor(message = "Некоректний запит") {
        // Викликаємо конструктор батьківського класу з повідомленням та статусом 400 
        super(message, 400); 
    }
}

export class NotFoundError extends AppError {
    constructor(message = "Ресурс не знайдено") { 
        super(message, 404); 
    }
}