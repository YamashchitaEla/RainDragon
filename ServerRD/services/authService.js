import { User } from "../models/User.js"
import "dotenv/config";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const generateTokens = (userId, admin) => {
    const accessToken = jwt.sign({ userId, admin }, process.env.JWT_SECRET, { expiresIn: "1h" });
    const refreshToken = jwt.sign({ userId, admin }, process.env.REFRESH_SECRET, { expiresIn: "7d" });
    return { accessToken, refreshToken };
};

export const loginService = async (login, password, requestedAdminRole) => {
    const user = await User.findByLogin(login);
    if (!user) {
        throw new Error("Користувач не знайдений");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new Error("Невірні облікові дані");
    }

    // 1. Приводимо вхідне значення до чистого булевого типу
    // (на випадок, якщо з фронта прийшло "true", 1 або true)
    const wantsAdmin = requestedAdminRole === true || requestedAdminRole === "true";

    // 2. Перевіряємо: якщо він хоче бути адміном, але в базі він НЕ адмін - видаємо помилку
    if (wantsAdmin && !user.admin) {
        throw new Error("У вас немає прав адміністратора");
    }

    // 3. Визначаємо фінальну роль для токена:
    // Він буде адміном у токені тільки якщо він адмін у базі І він сам цього захотів
    const finalAdminStatus = user.admin && wantsAdmin;

    return {
        success: true,
        ...generateTokens(user.id, finalAdminStatus),
        message: finalAdminStatus ? "Logged in as Admin" : "Logged in as User",
    };
}

export const registerService = async (nickname, login, password) => {
    // Перевіряємо, чи існує користувач з таким логіном
    const existingUser = await User.findByLogin(login);
    if (existingUser) {
        throw new Error("Користувач вже існує");
    }

    // Якщо користувач не існує — створюємо нового
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({ nickname, login, password: hashedPassword }); // тут у нас вже є user.id

    return {
        success: true,
        ...generateTokens(user.id, false),
        message: "User registered successfully"
    };
};