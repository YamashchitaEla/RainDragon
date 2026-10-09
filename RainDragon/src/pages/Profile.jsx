import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { requestWithRefresh } from "../api/requestWithRefresh";
import BookCard from "../cards/BookCard";
import '../styles/pages/_profile.css'; // Створіть цей файл для стилів

function Profile() {
    const { id } = useParams(); // ID профілю, який ми переглядаємо
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [watchList, setWatchList] = useState([]);

    // Отримання даних поточного користувача з токена
    const token = localStorage.getItem("token");
    let currentUser = null;
    if (token) {
        try {
            currentUser = jwtDecode(token);
        } catch (e) {
            console.error("Помилка декодування токена");
        }
    }

    const isOwner = currentUser && String(currentUser.userId) === String(id);

    // Завантаження даних профілю та списку книг
    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                // 1. Завантаження даних користувача
                const userRes = await requestWithRefresh(`http://localhost:5000/api/users/${id}`, {
                    method: "GET"
                });
                const userData = await userRes.json();
                if (userRes.ok) setUser(userData.user);

                // 2. Завантаження списку книг (тільки якщо власник)
                if (isOwner) {
                    const listRes = await requestWithRefresh(`http://localhost:5000/api/watchlist/user/${id}`, {
                        method: "GET"
                    });
                    const listData = await listRes.json();
                    if (listRes.ok) {
                        setWatchList(listData.watchlist || []);
                    }
                }
            } catch (err) {
                console.error("Помилка завантаження профілю:", err);
            }
        };

        fetchProfileData();
    }, [id, isOwner]);

    const [editMode, setEditMode] = useState(false);
    const [newNickname, setNewNickname] = useState("");
    const [newAbout, setNewAbout] = useState("");
    const [selectedFile, setSelectedFile] = useState(null);
    const [avatarUrl, setAvatarUrl] = useState(null);

    useEffect(() => {
        if (user) {
            setNewNickname(user.nickname || "");
            setNewAbout(user.about || "");
            setAvatarUrl(user.avatar);
        }
    }, [user, editMode]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            setAvatarUrl(URL.createObjectURL(file)); // Тимчасове прев'ю
        }
    };

    // Функція для стиснення зображення перед відправкою на сервер
    const resizeImage = (file, maxSize = 300) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const canvas = document.createElement("canvas");
            const reader = new FileReader();

            // Завантажуємо зображення у img.src через FileReader, щоб отримати Data URL
            reader.onload = (e) => {
                img.src = e.target.result;
            };

            // Коли зображення завантажено, змінюємо його розмір
            img.onload = () => {
                // У скільки разів потрібно зменшити зображення, щоб воно відповідало maxSize
                // Приклад: якщо ширина 600px, а maxSize 300px, то ratio = 0.5
                const ratio = Math.min(
                    maxSize / img.width,
                    maxSize / img.height
                );

                canvas.width = img.width * ratio;
                canvas.height = img.height * ratio;

                // Малюємо зображення на canvas з новими розмірами
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            // Створюємо новий файл з Blob і передаємо його далі
                            resolve(
                                new File([blob], file.name, {
                                    type: "image/jpeg"
                                })
                            );
                        } else {
                            reject(new Error("Не вдалося стиснути зображення"));
                        }
                    },
                    "image/jpeg",
                    0.85
                );
            };

            // Обробка помилок
            img.onerror = reject;
            reader.onerror = reject;

            // Запускаємо читання файлу, що призведе до виклику reader.onload
            reader.readAsDataURL(file);
        });
    };

    const handleSave = async () => {
        try {
            const formData = new FormData();
            formData.append("nickname", newNickname);
            formData.append("about", newAbout);
            if (selectedFile) {
                const resizedFile = await resizeImage(selectedFile);
                formData.append("avatar", resizedFile);
            }
            console.time("TOTAL");
            const response = await requestWithRefresh(`http://localhost:5000/api/user/update/${id}`, {
                method: "PUT",
                body: formData
            });
            console.timeEnd("TOTAL");

            if (response.ok) {
                alert("Профіль оновлено!");
                const updatedData = await response.json();
                setUser(updatedData.user);
                setEditMode(false);
                setSelectedFile(null);
            }
        } catch (err) {
            console.error("Помилка оновлення профілю:", err);
        }
    };

    
    // Фільтрація книг за статусами
    const filterByStatus = (status) => watchList.filter(item => item.watchlist_status === status);
    const categories = [
        { id: 'В процесі', label: 'В процесі', icon: 'fa-book-open' },
        { id: 'Заплановано', label: 'Заплановано', icon: 'fa-calendar-check' },
        { id: 'Прочитано', label: 'Прочитано', icon: 'fa-check-double' }
    ];

    // Обробник виходу з акаунту
    const handleLogout = async () => {
        if (!window.confirm("Ви впевнені, що хочете вийти?")) return;

        try {
            // Викликаємо бекенд, щоб видалити HttpOnly куку
            await fetch("http://localhost:5000/api/logout", {
                method: "POST",
                credentials: "include", // ОБОВ'ЯЗКОВО для роботи з куками
            });
        } catch (err) {
            console.error("Помилка при виході на сервері:", err);
        } finally {
            // У будь-якому випадку чистимо локальні дані
            localStorage.removeItem("token");
            navigate("/");
            window.location.reload();
        }
    };

    if (!user) {
        return (
            <div className="profile-page">
                <div className="no-results">
                    <p>На жаль, такого користувача не існує.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-page">
            <div className="profile-header">
                <div className="profile-header__avatar-container">
                    <div className="avatar-wrapper">
                        <img
                            src={avatarUrl || "/default-avatar.png"}
                            alt="Аватар"
                            className="profile-header__avatar"
                        />
                        {editMode && (
                            <label className="avatar-upload-label">
                                <i className="fas fa-camera"></i>
                                <input type="file" onChange={handleFileChange} hidden accept="image/*" />
                            </label>
                        )}
                    </div>
                </div>

                <div className="profile-header__info">
                    {editMode ? (
                        <div className="profile-edit-fields">
                            <input
                                type="text"
                                className="edit-nickname-input"
                                value={newNickname}
                                onChange={(e) => setNewNickname(e.target.value)}
                                placeholder="Нікнейм"
                            />
                            <textarea
                                className="profile-header__textarea"
                                value={newAbout}
                                onChange={(e) => setNewAbout(e.target.value)}
                                placeholder="Розкажіть про себе..."
                            />
                            <div className="profile-header__edit-actions">
                                <button onClick={handleSave} className="profile-header__save-btn">Зберегти</button>
                                <button onClick={() => setEditMode(false)} className="profile-header__cancel-btn">Скасувати</button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <h2 className="profile-header__nickname">
                                {user.nickname}
                                {user.admin && <span className="admin-badge" title="Адміністратор"><i className="fas fa-shield-halved"></i></span>}
                            </h2>
                            <p className="profile-header__about">{user.about || "Інформація відсутня"}</p>
                        </>
                    )}
                </div>

                {isOwner && !editMode && (
                    <div className="page-profile__controls">
                        <button className="page-profile__control-btn page-profile__control-btn--edit" onClick={() => setEditMode(true)}>
                            <i className="fas fa-edit"></i>
                        </button>
                        <button className="page-profile__control-btn page-profile__control-btn--exit" onClick={handleLogout} title="Вийти з акаунту">
                            <i className="fas fa-sign-out-alt"></i>
                        </button>
                    </div>
                )}
            </div>

            {isOwner ? (
                <div className="profile-content">
                    <h3 className="profile-content__title">Мій список новел</h3>

                    {watchList.length > 0 ? (
                        categories.map(cat => {
                            const books = filterByStatus(cat.id);
                            if (books.length === 0) return null; // Не показуємо порожні категорії

                            return (
                                <div key={cat.id} className="profile-category">
                                    <h4 className="profile-category__name">
                                        <i className={`fas ${cat.icon}`}></i> {cat.label} ({books.length})
                                    </h4>
                                    <div className="profile-content__list">
                                        {books.map(book => (
                                            <BookCard
                                                key={book.id}
                                                preview={book.preview}
                                                ukrainian_name={book.ukrainian_name}
                                                author={book.author.map(a => a.full_name).join(", ")}
                                                id={book.id}
                                            />
                                        ))}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <p className="profile-content__empty">Ваш список новел порожній.</p>
                    )}
                </div>
            ) : (
                <div className="profile-content__private">
                    <p><i className="fas fa-lock"></i> Списки книг доступні лише власнику профілю.</p>
                </div>
            )}
        </div>
    );
}

export default Profile;