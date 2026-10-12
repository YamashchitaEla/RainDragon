import { jwtDecode } from "jwt-decode";

let isRefreshing = false;

// Канал для обміну повідомленнями між вкладками RainDragon
const refreshChannel =
    typeof BroadcastChannel !== "undefined"
        ? new BroadcastChannel("raindragon-auth")
        : null;

// Отримати токен
const getStoredToken = () =>
    sessionStorage.getItem("token") ||
    localStorage.getItem("token");

// Перевірити, чи access-токен ще дійсний
// Це лише попередня перевірка на фронтенді, а не перевірка підпису JWT
const isAccessTokenValid = (token) => {
    try {
        if (!token) return false;
        const decoded = jwtDecode(token);
        return Boolean(decoded.exp) && decoded.exp * 1000 > Date.now();
    } catch {
        return false;
    }
};

// Зберегти access-токен у правильне сховище
// rememberMe=true — localStorage
// rememberMe=false — sessionStorage
const saveAccessToken = (token, rememberMe) => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");

    if (rememberMe) {
        localStorage.setItem("token", token);
    } else {
        sessionStorage.setItem("token", token);
    }
};

// Повідомити інші вкладки про оновлення токена
// Сесійний токен не передаємо іншим вкладкам
const broadcastToken = (token, rememberMe) => {
    if (rememberMe) {
        refreshChannel?.postMessage({
            type: "TOKEN_UPDATED",
            accessToken: token,
        });
    } else {
        refreshChannel?.postMessage({
            type: "REFRESH_COMPLETED",
        });
    }
};

// Повідомити всі вкладки про завершення авторизації
const broadcastLogout = () => {
    refreshChannel?.postMessage({
        type: "AUTH_LOGOUT",
    });
};

// Отримати повідомлення від інших вкладок
if (refreshChannel) {
    refreshChannel.onmessage = (event) => {
        const { type, accessToken } = event.data || {};

        if (type === "TOKEN_UPDATED" && accessToken) {
            // Інша вкладка оновила токен із rememberMe=true
            saveAccessToken(accessToken, true);
            window.dispatchEvent(new Event("authChanged"));
        }

        if (type === "REFRESH_COMPLETED") {
            // Інша вкладка завершила оновлення сесійного токена
            // Сам токен не копіювати: ця вкладка використовує власний sessionStorage
            window.dispatchEvent(new Event("authChanged"));
        }

        if (type === "AUTH_LOGOUT") {
            localStorage.removeItem("token");
            sessionStorage.removeItem("token");

            window.dispatchEvent(new Event("authChanged"));

            if (window.location.pathname !== "/") {
                window.location.href = "/";
            }
        }
    };
}

// Виконати оновлення токена з координацією між вкладками
// Повертає об'єкт { accessToken, rememberMe }, а не лише рядок
export const refreshAccessToken = async (tokenBeforeRefresh = getStoredToken()) => {
    // Виконується після отримання блокування
    const performRefresh = async () => {
        console.log("Викликано refreshAccessToken");
        // Поки ця вкладка чекала на блокування, інша вкладка могла вже оновити токен
        const currentToken = getStoredToken();
        if (currentToken && currentToken !== tokenBeforeRefresh && isAccessTokenValid(currentToken)) {
            return {
                accessToken: currentToken,
                rememberMe: localStorage.getItem("token") === currentToken,
            };
        }

        const refreshRes = await fetch(
            "http://localhost:5000/api/refresh",
            {
                method: "POST",
                credentials: "include",
            }
        );

        if (!refreshRes.ok) {
            const error = new Error("Refresh failed");
            error.status = refreshRes.status;
            throw error;
        }

        const data = await refreshRes.json();

        if (!data.accessToken) {
            throw new Error("Access token is missing");
        }

        if (typeof data.rememberMe !== "boolean") {
            throw new Error("rememberMe is missing from refresh response");
        }

        if (!isAccessTokenValid(data.accessToken)) {
            throw new Error("Received an invalid access token");
        }

        saveAccessToken(data.accessToken, data.rememberMe);

        // Повідомити інші вкладки про результат оновлення
        broadcastToken(data.accessToken, data.rememberMe);

        window.dispatchEvent(new Event("authChanged"));

        return {
            accessToken: data.accessToken,
            rememberMe: data.rememberMe,
        };
    };

    try {
        // Web Locks API дозволяє лише одній вкладці одночасно виконувати запит на оновлення токена
        if (navigator.locks?.request) {
            return await navigator.locks.request(
                "raindragon-refresh-token",
                async () => performRefresh()
            );
        }

        // Якщо браузер не підтримує Web Locks, виконати оновлення без міжвкладкового блокування
        return await performRefresh();
    } catch (err) {
        // Недійсна або завершена сесія
        // Мережеві помилки не повинні автоматично видаляти токен
        if (err.status === 401 || err.status === 403) {
            localStorage.removeItem("token");
            sessionStorage.removeItem("token");

            broadcastLogout();
            window.dispatchEvent(new Event("authChanged"));
        }

        throw err;
    }
};

export const requestWithRefresh = async (url, options = {}) => {
    // Функція для виконання запиту з автоматичним оновленням access-токена при 401 помилці
    const makeRequest = (token) => {
        const accessToken = token || getStoredToken();

        return fetch(url, {
            ...options,
            headers: {
                ...(options.headers || {}),
                ...(accessToken
                    ? { Authorization: `Bearer ${accessToken}` }
                    : {}),
            },
        });
    };

    // Виконати запит уперше з поточним токеном
    let res = await makeRequest();

    if (res.status !== 401) {
        return res;
    }

    // Без access-токена не намагаємося оновлювати його тут
    // AuthContext окремо відновлює сесію під час ініціалізації
    const tokenBeforeRefresh = getStoredToken();

    if (!tokenBeforeRefresh) {
        return res;
    }

    // Завдяки Web Locks API, просто викликаємо рефреш. 
    // Якщо інший запит/вкладка вже оновлює токен, цей потік дочекається його завершення.
    try {
        const data = await refreshAccessToken(tokenBeforeRefresh);
        return await makeRequest(data.accessToken);
    } catch (err) {
        // Якщо сесія недійсна, переходимо на головну сторінку
        if (err.status === 401 || err.status === 403) {
            if (window.location.pathname !== "/") {
                window.location.href = "/";
            }
        }
        // При мережевій помилці не видаляти токен
        return res;
    }
};