import { useState } from 'react';
import { jwtDecode } from "jwt-decode";
import { useNavigate } from 'react-router-dom';
import '../styles/components/_header.css';

export default function Header() {
    const navigate = useNavigate();
    const token = localStorage.getItem("token");
    const currentUser = jwtDecode(token);
    const [menuOpen, setMenuOpen] = useState(false);

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
                    <a href="/main" className="header__nav-link">Головна</a>
                    <a href="/posts" className="header__nav-link">Форум</a>
                    <a href="/books" className="header__nav-link">Новели</a>
                    <a href="/writers" className="header__nav-link">Автори</a>
                </nav>

                <div className="user-icon">
                    <i className="fa-solid fa-circle-user" onClick={() => navigate(`/profile/${currentUser.userId}`)}></i>
                </div>
            </header>
        </>
    );
}