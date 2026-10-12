import { loginService, registerService } from "../services/authService.js";
import { COOKIE_NAME, cookieOptions, clearRefreshCookie} from "../utils/cookieOptions.js";
import { createRefreshSession, revokeRefreshSession } from "../services/refreshSessionService.js";
import { handleControllerError } from '../utils/errorHelper.js';

export const login = async (req, res) => {
    try {
        const { login, password, admin, rememberMe } = req.body;
        const { userId, accessToken, refreshToken } = await loginService(
            login, 
            password, 
            admin
        );

        // Якщо галочка ввімкнена, cookie зберігатиметься до 7 днів. Коли вимкнена — буде сесійною cookie без maxAge
        const remember = rememberMe === true || rememberMe === "true";
        await createRefreshSession(userId, refreshToken, remember);
        res.cookie(COOKIE_NAME, refreshToken, cookieOptions(remember));

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
        const { nickname, login, password, rememberMe } = req.body;
        const { userId, accessToken, refreshToken } = await registerService(
            nickname,
            login,
            password
        );

        // Якщо галочка ввімкнена, cookie зберігатиметься до 7 днів. Коли вимкнена — буде сесійною cookie без maxAge
        const remember = rememberMe === true || rememberMe === "true";
        await createRefreshSession(userId, refreshToken, remember);
        res.cookie(COOKIE_NAME, refreshToken, cookieOptions(remember));

        return res.status(201).json({
            success: true,
            accessToken,
            message: "User registered successfully"
        });
    } catch (err) {
        return handleControllerError(res, err, "Register Error");
    }
};

export const logout = async (req, res) => {
    try {

        const refreshToken = req.cookies?.refreshToken;

        if (refreshToken) {
            await revokeRefreshSession(refreshToken);
        }

        clearRefreshCookie(res);
        
        return res.status(200).json({
            success: true
        });
    } catch (err) {
        return handleControllerError(res, err, "Logout Error");
    }
};