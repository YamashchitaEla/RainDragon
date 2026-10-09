import { loginService } from "../services/authService.js";
import { registerService } from "../services/authService.js";
import jwt from "jsonwebtoken";

export const login = async (req, res) => {
    try {
        const { login, password, admin } = req.body;
        const { success, accessToken, refreshToken, message } = await loginService(login, password, admin);

        // Відправляємо refreshToken в httpOnly cookie
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        // AccessToken відправляємо у JSON
        res.json({ success, accessToken, message });
    } catch (err) {
        res.status(401).json({ message: err.message });
    }
};

export const register = async (req, res) => {
    try {
        const { nickname, login, password } = req.body;
        // Отримуємо refreshToken з сервісу (переконайтесь, що сервіс його повертає)
        const { success, accessToken, refreshToken, message } = await registerService(nickname, login, password);

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.json({ success, accessToken, message });
    } catch (err) {
        res.status(401).json({ message: err.message });
    }
};

export const refresh = async (req, res) => {
    try {
        const refreshToken = req.cookies?.refreshToken;
        if (!refreshToken) return res.status(401).json({ message: "No refresh token" });

        const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);

        // Об'єднуємо userId та admin в один об'єкт payload
        const newAccessToken = jwt.sign(
            { userId: decoded.userId, admin: decoded.admin },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.json({ accessToken: newAccessToken });
    } catch (err) {
        res.status(403).json({ message: "Refresh token invalid" });
    }
};

export const logout = async (req, res) => {
    try {
        // видаляє cookie з ім'ям refreshToken у браузері користувача
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: false,
            sameSite: "lax"
        });
        
        return res.status(200).json({ success: true, message: "Вихід виконано" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
