export class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class BadRequestError extends AppError {
    // Повідомлення за замовчуванням, але можна передати власне
    constructor(message = "Некоректний запит") {
        // Викликати конструктор батьківського класу з повідомленням та статусом 400 
        super(message, 400); 
    }
}

export class UnauthorizedError extends AppError {
    constructor(message = "Необхідна авторизація") {
        super(message, 401);
    }
}

export class NotFoundError extends AppError {
    constructor(message = "Ресурс не знайдено") { 
        super(message, 404); 
    }
}
