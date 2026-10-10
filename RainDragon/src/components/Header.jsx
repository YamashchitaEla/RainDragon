import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { requestWithRefresh } from "../api/requestWithRefresh";
import '../styles/components/_header.css';

export default function Header() {
    const navigate = useNavigate();

    const { currentUser, isAdmin } = useAuth();
    const isLoggedIn = Boolean(currentUser);

    const [menuOpen, setMenuOpen] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState(null);

    useEffect(() => {
        const fetchProfileData = async () => {
            if (!currentUser) {
                return;
            }

            try {
                // Завантаження даних користувача
                const userRes = await requestWithRefresh(
                    `http://localhost:5000/api/users/${currentUser.userId}`
                );
                const userData = await userRes.json();
                
                if (userRes.ok) {
                    setAvatarUrl(userData.user.avatar);
                }
            } catch (err) {
                console.error("Помилка завантаження профілю:", err);
            }
        };
        fetchProfileData();
    }, [currentUser?.userId]);

    return (
        <>
            <div className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
                <i className="fa-solid fa-bars"></i>
            </div>
            <header className="header">
                <div className="header__left">
                    <div className="header__logo">
                        <img src="/logo.PNG" alt="RainDragon Logo" className="header__logo-image" />
                    </div>
                </div>

                {/* Навігація */}
                <nav className={`header__nav ${menuOpen ? 'open' : ''}`}>
                    <Link to="/" className="header__nav-link">Головна</Link>
                    <Link to="/posts" className="header__nav-link">Форум</Link>
                    <Link to="/books" className="header__nav-link">Новели</Link>
                    <Link to="/writers" className="header__nav-link">Автори</Link>
                </nav>

                <div className="user-icon">
                    {isLoggedIn ? (
                        <img
                            src={avatarUrl || "/default-avatar.png"}
                            alt="Аватар"
                            className="profile-header__avatar"
                            onClick={() => navigate(`/profile/${currentUser.userId}`)}
                        />
                    ) : (
                        <img
                            src={"/default-avatar.png"}
                            alt="Аватар"
                            className="profile-header__avatar"
                            onClick={() => navigate("/become_dragon")}
                        />
                    )}
                </div>
            </header>
        </>
    );
}