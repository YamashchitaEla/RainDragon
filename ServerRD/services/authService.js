import { User } from "../models/User.js"
import { BadRequestError, UnauthorizedError, AppError } from "../utils/customErrors.js";
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
    const isMatch = user
        ? await bcrypt.compare(password, user.password)
        : false;

    if (!user || !isMatch) {
        throw new UnauthorizedError("Невірні облікові дані");
    }

    // Визначення фінальньної ролі для токена:
    // Користувач буде адміністрартором у токені тільки якщо користувач має таке бажання і є адміністратором системі
    const wantsAdmin = requestedAdminRole === true || requestedAdminRole === "true";
    if (wantsAdmin && !user.admin) {
        throw new AppError("У вас немає прав адміністратора", 403);
    }
    
    const finalAdminStatus = user.admin && wantsAdmin;

    return {
        ...generateTokens(user.id, finalAdminStatus),
    };
}

export const registerService = async (nickname, login, password) => {
    const existingUser = await User.findByLogin(login);
    if (existingUser) {
        throw new BadRequestError("Користувач вже існує");
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({ nickname, login, password: hashedPassword }); // тут у нас вже є user.id

    return {
        ...generateTokens(user.id, false),
    };
};