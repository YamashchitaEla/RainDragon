import { loginService, registerService } from "../services/authService.js";
import { handleControllerError } from "../utils/errorHandler.js";
import jwt from "jsonwebtoken";

export const login = async (req, res) => {
    try {
        const { login, password, admin } = req.body;
        const { accessToken, refreshToken } = await loginService(
            login, 
            password, 
            admin
        );

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.status(200).json({
            success: true,
            accessToken,
            message: admin === true || admin === "true"
                ? "Logged in as Admin"
                : "Logged in as User"
        });
    } catch (err) {
        return handleControllerError(res, err, "Login Error");
    }
};

export const register = async (req, res) => {
    try {
        const { nickname, login, password } = req.body;
        const { accessToken, refreshToken } = await registerService(
            nickname,
            login,
            password
        );

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.status(201).json({
            success: true,
            accessToken,
            message: "User registered successfully"
        });
    } catch (err) {
        return handleControllerError(res, err, "Register Error");
    }
};

export const refresh = async (req, res) => {
    try {
        const refreshToken = req.cookies?.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: "No refresh token"
            });
        }

        const decoded = jwt.verify(
            refreshToken,
            process.env.REFRESH_SECRET
        );

        const newAccessToken = jwt.sign(
            { userId: decoded.userId, admin: decoded.admin },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        return res.status(200).json({
            success: true,
            accessToken: newAccessToken
        });
    } catch (err) {
        return handleControllerError(res, err, "Refresh Token Invalid");
    }
};

export const logout = async (req, res) => {
    try {
        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax"
        });

        return res.status(200).json({
            success: true
        });
    } catch (err) {
        return handleControllerError(res, err, "Logout Error");
    }
};