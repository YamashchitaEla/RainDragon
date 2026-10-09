import { useState } from "react";
import { useNavigate } from "react-router-dom";
// Logo import from public
import { useLocation } from "react-router-dom";
import '../styles/pages/_login.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

function LoginPage() {
    const navigate = useNavigate();

    const [showPassword, setShowPassword] = useState(false);

    const [nickname, setNickname] = useState("");
    const [login, setLogin] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");

    // Об'єкт location для отримання даних про поточну локацію (дані НЕ з URL)s
    const location = useLocation();
    const mode = location.state.mode;

    // Функція для обробки форми входу/реєстрації
    const handleLogin = async (e) => {
        e.preventDefault();
        setMessage("");
        try {
            let res = null;
            if (mode === "login") {
                res = await fetch(
                    "http://localhost:5000/api/login", 
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                        body: JSON.stringify({ 
                            login, 
                            password, 
                            admin 
                        }),
                    }
                );
            }
            else {
                res = await fetch(
                    "http://localhost:5000/api/register", 
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                        body: JSON.stringify({ 
                            nickname, 
                            login, 
                            password 
                        }),
                    }
                );
            }

            const data = await res.json();
            if (!res.ok) {
                setMessage(data.message || "Помилка на сервері");
                return;
            }

            localStorage.setItem("token", data.accessToken);

            setTimeout(() => {
                navigate("/main");
            }, 1000); // затримка 1 сек, щоб користувач побачив повідомлення

        } catch (err) {
            setMessage("Помилка з’єднання з сервером");
        }
    };

    // Функція для перемикання ролі користувача (адміністратор/звичайний користувач)
    const [admin, setAdmin] = useState(false);
    const toggleUserRole = () => {
        setAdmin(prev => {
            if (prev === true) {
                return false;
            }
            return true;
        });
    }

    return (
        <div className="login-page">
            <div className="background"></div>
            <form className="login-form" onSubmit={handleLogin}>
                <img id="logo-login" src={"/logo.PNG"}></img>
                {mode === "register" && (
                    <div className="login-form__item">
                        <i className="fa-solid fa-user"></i>
                        <input name="nickname"
                            type="text"
                            required
                            className="login-form__input"
                            placeholder="Nickname"
                            autoComplete="username"
                            onChange={e => setNickname(e.target.value)} />
                    </div>
                )}
                <div className="login-form__item">
                    <i className="fa-solid fa-envelope"></i>
                    <input name="login"
                        type="email"
                        required
                        className="login-form__input"
                        placeholder="Login"
                        autoComplete="email"
                        onChange={e => setLogin(e.target.value)} />
                </div>

                <div className="login-form__item">
                    <i className="fa-solid fa-lock"></i>
                    <input name="password"
                        type={showPassword ? "text" : "password"}
                        required className="login-form__input"
                        placeholder="Password"
                        maxLength={15}
                        autoComplete={mode === "login" ? "current-password" : "new-password"}
                        onChange={e =>
                            setPassword(e.target.value)} />
                    <i className={showPassword ? "fa-solid fa-eye" : "fa-solid fa-eye-slash"} onClick={() => setShowPassword(!showPassword)}></i>
                </div>
                {mode === "login" && (
                    <label className="login-form__switch">
                        Увійти як адміністратор
                        <input
                            type="checkbox"
                            onChange={toggleUserRole}
                        />
                        <span className="slider round"></span>
                    </label>
                )}

                {message && (<p className={"message-error"}>{message}</p>)}

                {mode === "login" ? (
                    <div className="login-form__buttons">
                        <button type="submit"
                            className="login-form__button_active"
                        >Увійти</button>
                        <button type="button"
                            className="login-form__button_passive"
                            onClick={() => navigate("/login", { state: { mode: "register" } })}
                        >Створити акаунт</button>
                    </div>
                ) : (
                    <div className="login-form__buttons">
                        <button type="submit" className="login-form__button_active">Зареєструватися </button>
                    </div>
                )}
            </form>
        </div>
    );
}

export default LoginPage;