import { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [authChecked, setAuthChecked] = useState(false);

    useEffect(() => {
        const checkUser = () => {
            const token = localStorage.getItem("token");

            if (!token) {
                setCurrentUser(null);
                setAuthChecked(true);
                return;
            }

            try {
                setCurrentUser(jwtDecode(token));
            } catch (e) {
                console.error("Помилка декодування токена:", e);
                setCurrentUser(null);
            } finally {
                setAuthChecked(true);
            }
        };

        // Перевірка під час відкриття застосунку
        checkUser();

        // Зміни токена в іншій вкладці
        window.addEventListener("storage", checkUser);

        // Зміни токена в поточній вкладці
        window.addEventListener("authChanged", checkUser);

        return () => {
            window.removeEventListener("storage", checkUser);
            window.removeEventListener("authChanged", checkUser);
        };
    }, []);

    const isAdmin = currentUser?.admin === true;

    return (
        <AuthContext.Provider
            value={{ currentUser, isAdmin, authChecked }}
        >
            {children}
        </AuthContext.Provider>
    );
}

// Хук для отримання даних авторизації
export function useAuth() {
    return useContext(AuthContext);
}