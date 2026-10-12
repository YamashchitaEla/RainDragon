import { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { refreshAccessToken } from "../api/requestWithRefresh.js";

const AuthContext = createContext(null);

const getStoredToken = () => {
    return (
        sessionStorage.getItem("token") ||
        localStorage.getItem("token")
    );
};

// Перевірити, чи браузер раніше мав авторизовану сесію
const hasKnownSession = () => {
    return (
        localStorage.getItem("sessionKnown") === "true" ||
        sessionStorage.getItem("sessionKnown") === "true"
    );
};

// Зберегти прапорець у сховищі відповідно до режиму входу
const saveSessionKnown = (rememberMe) => {
    localStorage.removeItem("sessionKnown");
    sessionStorage.removeItem("sessionKnown");

    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem("sessionKnown", "true");
};

// Очистити access-токени та прапорці авторизації
const removeAccessToken = () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");

    // Існування сесії раніше
    localStorage.removeItem("sessionKnown");
    sessionStorage.removeItem("sessionKnown");
};

const decodeValidToken = (token) => {
    try {
        const decoded = jwtDecode(token);

        if (!decoded.exp || decoded.exp * 1000 <= Date.now()) {
            return null;
        }

        return decoded;
    } catch {
        return null;
    }
};

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [authChecked, setAuthChecked] = useState(false);

    useEffect(() => {
        let cancelled = false;
        let refreshing = false;

        const setUserFromStorage = async () => {
            if (refreshing) return;

            const token = getStoredToken();
            const decoded = token ? decodeValidToken(token) : null;

            // Якщо access-токен дійсний — оновлюємо користувача
            if (decoded) {
                if (!cancelled) setCurrentUser(decoded);
                return;
            }

            // Якщо сесії раніше не було — залишаємо користувача неавторизованим
            if (!hasKnownSession()) {
                if (!cancelled) setCurrentUser(null);
                return;
            }

            // Access-токен відсутній або невалідний — refresh
            refreshing = true;

            try {
                const data = await refreshAccessToken(token);

                if (!data?.accessToken) {
                    throw new Error("Сервер не повернув access-токен");
                }

                const refreshedUser = decodeValidToken(data.accessToken);

                if (!refreshedUser) {
                    throw new Error("Отримано недійсний access-токен");
                }

                saveSessionKnown(data.rememberMe);

                if (!cancelled) {
                    setCurrentUser(refreshedUser);
                }
            } catch (err) {
                console.error("Помилка відновлення сесії:", err);

                // Завершити сесію лише тоді, коли сервер відхилив refresh
                if (err.status === 401 || err.status === 403) {
                    removeAccessToken();
                }

                if (!cancelled) {
                    setCurrentUser(null);
                }
            } finally {
                refreshing = false;
            }
        };

        const initializeAuth = async () => {
            await setUserFromStorage();

            if (!cancelled) {
                setAuthChecked(true);
            }
        };

        const handleStorage = () => {
            setUserFromStorage();
        };

        const handleAuthChanged = () => {
            setUserFromStorage();
        };

        initializeAuth();

        window.addEventListener("storage", handleStorage);
        window.addEventListener("authChanged", handleAuthChanged);

        return () => {
            cancelled = true;
            window.removeEventListener("storage", handleStorage);
            window.removeEventListener("authChanged", handleAuthChanged);
        };
    }, []);

    const isAdmin = currentUser?.admin === true;

    return (
        <AuthContext.Provider
            value={{
                currentUser,
                isAdmin,
                authChecked
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
