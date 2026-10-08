import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];

    if (!token) return res.status(401).json({ message: "Токен відсутній" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        // Якщо токен прострочений або невалідний — просто 401
        // Клієнт отримає цю помилку і зрозуміє, що треба йти на /refresh
        return res.status(401).json({ message: "Token expired or invalid" });
    }
};