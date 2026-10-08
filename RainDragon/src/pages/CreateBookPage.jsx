import React, { useEffect, useState } from "react"; // Виправив імпорт (прибрав 'use')
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { requestWithRefresh } from "../api/requestWithRefresh";
import '../styles/pages/_create-book.css';
import { jwtDecode } from "jwt-decode";

function CreateBookPage() {
    const { id } = useParams(); // Отримуємо ID з URL
    const navigate = useNavigate();
    const location = useLocation();
    
    // Визначаємо режим на основі наявності ID або переданого стану
    const mode = location.state?.mode || (id ? "edit" : "create");

    // Перевірка на адміна
    useEffect(() => {
        const token = localStorage.getItem("token");
        const currentUser = jwtDecode(token);
        const isAdmin = currentUser.admin === true;
        if (!isAdmin) {
            alert("У вас немає прав для доступу до цієї сторінки.");
            window.location.href = "/"; // Перенаправлення на головну сторінку
        }
    }, []);

    const [book, setBook] = useState(null);
    const [preview, setPreview] = useState(null);
    const [text, setText] = useState(null);

    // Список авторів та жанрів для вибору
    const [authorsList, setAuthorsList] = useState([]);
    const [genresList, setGenresList] = useState([]);

    // Обрані автори та жанри для книги
    const [selectedAuthors, setSelectedAuthors] = useState([]);
    const [selectedGenres, setSelectedGenres] = useState([]);

    // Завантаження даних книги при редагуванні
    useEffect(() => {
        if (mode === "edit" && id) {
            const fetchBookData = async () => {
                try {
                    const res = await requestWithRefresh(`http://localhost:5000/api/book/${id}`);
                    if (res.ok) {
                        const data = await res.json();
                        setBook(data.bookInfo || null);
                    }
                } catch (err) {
                    console.error("Помилка завантаження даних книги:", err);
                }
            };
            fetchBookData();
        }
    }, [id, mode]);

    // Завантаження авторів та жанрів книги
    useEffect(() => {
        if (mode === "edit" && book) {
            const fetchBookAuthors = async () => {
                try {
                    const res = await requestWithRefresh(`http://localhost:5000/api/writers/${book.id}`, {
                        method: "GET"
                    });
                    if (res.ok) {
                        const data = await res.json();
                        setSelectedAuthors(data.writers.map(w => w.id));
                    }
                } catch (err) {
                    console.error("Помилка завантаження авторів книги:", err);
                }
            };
            fetchBookAuthors();
        }
    }, [book]);
    useEffect(() => {
        if (mode === "edit" && book) {
            const fetchGenres = async () => {
                try {
                    const res = await requestWithRefresh(`http://localhost:5000/api/genres/${id}`, {
                        method: "GET"
                    });
                    if (res.ok) {
                        const data = await res.json();
                        setSelectedGenres(data.genres.map(g => g.id));
                    }
                } catch (err) {
                    console.error("Помилка завантаження жанрів:", err);
                }
            };
            fetchGenres();
        }
    }, [book]);

    // Завантаження списків авторів та жанрів для вибору (для обох режимів)
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [authRes, genRes] = await Promise.all([
                    requestWithRefresh("http://localhost:5000/api/writers"),
                    requestWithRefresh("http://localhost:5000/api/genres")
                ]);
                const authData = await authRes.json();
                const genData = await genRes.json();

                if (authRes.ok) setAuthorsList(authData.writers || []);
                if (genRes.ok) setGenresList(genData.genres || []);
            } catch (err) {
                console.error("Помилка завантаження списків:", err);
            }
        };
        fetchData();
    }, []);

    // Додавання та видалення елементу зі списку
    const handleAddItem = (itemId, setSelected, currentSelected) => {
        if (itemId && !currentSelected.includes(itemId)) {
            setSelected([...currentSelected, itemId]);
        }
    };
    const handleRemoveItem = (itemId, setSelected, currentSelected) => {
        setSelected(currentSelected.filter(item => item !== itemId));
    };

    // Обробник відправки форми
    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append("original_name", book?.original_name || "");
        formData.append("ukrainian_name", book?.ukrainian_name || "");
        formData.append("year", book?.year || "");
        formData.append("status", book?.status || "В процесі");
        formData.append("volumes", book?.volumes || 1);
        formData.append("chapters", book?.chapters || 0);
        formData.append("extras", book?.extras || 0);
        formData.append("description", book?.description || "");

        selectedAuthors.forEach(authorId => {
            formData.append("authors", authorId);
        });

        selectedGenres.forEach(genreId => {
            formData.append("genres", genreId);
        });

        if (preview) {
            formData.append("preview", preview);
        }

        if (text) {
            formData.append("text", text);
        }
        const url = mode === "edit"
            ? `http://localhost:5000/api/book/update/${id}`
            : "http://localhost:5000/api/book/create";

        const method = mode === "edit" ? "PUT" : "POST";

        try {
            const res = await requestWithRefresh(url, {
                method: method,
                body: formData
            });

            if (res.ok) {
                const data = await res.json();
                alert(mode === "edit" ? "Книгу оновлено!" : "Книгу створено!");
                // id - з оновленного, що передали, bookId при створення повертається
                navigate(`/book/${id || data.bookId}`)
            } else {
                const error = await res.json();
                alert(`Помилка: ${error.message}`);
            }
        } catch (err) {
            console.error("Помилка відправки:", err);
        }
    };

    return (
        <div className="create-book-page">
            <h2 className="create-book__title">
                {mode === "edit" ? "Редагувати книгу" : "Додати нову книгу"}
            </h2>

            <form onSubmit={handleSubmit} className="create-book__form">
                {/* Оригінальна назва */}
                <div className="create-book__group">
                    <label className="create-book__label">Оригінальна назва книги:</label>
                    <input
                        className="create-book__input"
                        type="text"
                        value={book?.original_name || ""}
                        onChange={(e) => setBook({ ...book, original_name: e.target.value })}
                        required
                    />
                </div>
                {/* Українська назва */}
                <div className="create-book__group">
                    <label className="create-book__label">Українська назва книги:</label>
                    <input
                        className="create-book__input"
                        type="text"
                        value={book?.ukrainian_name || ""}
                        onChange={(e) => setBook({ ...book, ukrainian_name: e.target.value })}
                        required
                    />
                </div>

                {/* Обкладинка */}
                <div className="create-book__group">
                    <label className="create-book__label">
                        Обкладинка:
                    </label>

                    <label className="create-book__file">

                        <span className="create-book__file-btn">
                            Вибрати файл
                        </span>

                        <span className="create-book__file-name">
                                {preview ? preview.name : "Файл не вибраний"}
                            </span>

                            {mode === "create" ? (
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setPreview(e.target.files[0])}
                                    required
                                />
                            ) : (
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setPreview(e.target.files[0])}
                                />
                            )}
                    </label>
                    {preview ? (
                        <img
                            className="create-book__preview"
                            src={URL.createObjectURL(preview)}
                            alt="Нове прев'ю"
                        />
                    ) : (
                        book?.preview && (
                            <img
                                className="create-book__preview"
                                src={book.preview}
                                alt="Поточне прев'ю"
                            />
                        )
                    )}
                </div>

                {/* Рік видання */}
                <div className="create-book__group">
                    <label className="create-book__label">Рік видання:</label>
                    <input
                        className="create-book__input"
                        type="number"
                        value={book?.year || ""}
                        onChange={(e) => setBook({ ...book, year: e.target.value })}
                        min="2005"
                        required
                    />
                </div>
                {/* Статус */}
                <div className="create-book__group">
                    <label className="create-book__label">Статус перекладу:</label>
                    <select
                        className="create-book__select"
                        value={book?.status || "В процесі"}
                        onChange={(e) => setBook({ ...book, status: e.target.value })}
                    >
                        <option value="В процесі">В процесі</option>
                        <option value="Завершено">Завершено</option>
                    </select>
                </div>
                {/* Автори */}
                <div className="create-book__group">
                    <label className="create-book__label">Автори:</label>
                    <select
                        className="create-book__select"
                        onChange={(e) => handleAddItem(Number(e.target.value), setSelectedAuthors, selectedAuthors)}
                        value=""
                    >
                        <option value="">-- Додати автора --</option>
                        {authorsList.map(author => (
                            <option key={author.id} value={author.id}>{author.full_name}</option>
                        ))}
                    </select>
                    <div className="selected-items-tags">
                        {selectedAuthors.map((a, index) => {
                            const author = authorsList.find(au => au.id === parseInt(a));
                            return (
                                <span key={index} className="tag">
                                    {author?.full_name || "Завантаження..."}
                                    <button type="button" onClick={() => handleRemoveItem(author.id, setSelectedAuthors, selectedAuthors)}>×</button>
                                </span>
                            );
                        })}
                    </div>
                </div>

                {/* Жанри */}
                <div className="create-book__group">
                    <label className="create-book__label">Жанри:</label>
                    <select
                        className="create-book__select"
                        onChange={(e) => handleAddItem(Number(e.target.value), setSelectedGenres, selectedGenres)}
                        value=""
                    >
                        <option value="">-- Додати жанр --</option>
                        {genresList.map(genre => (
                            <option key={genre.id} value={genre.id}>{genre.genre}</option>
                        ))}
                    </select>
                    <div className="selected-items-tags">
                        {selectedGenres.map((g, index) => {
                            const genre = genresList.find(gr => gr.id === parseInt(g));
                            return (
                                <span key={index} className="tag">
                                    {genre?.genre || "Завантаження..."}
                                    <button type="button" onClick={() => handleRemoveItem(genre.id, setSelectedGenres, selectedGenres)}>×</button>
                                </span>
                            );
                        })}
                    </div>
                </div>

                {/* Кількість томів */}
                <div className="create-book__group">
                    <label className="create-book__label">Кількість томів:</label>
                    <input
                        type="number"
                        className="create-book__input"
                        value={book?.volumes || 1}
                        onChange={(e) => setBook({ ...book, volumes: parseInt(e.target.value) })}
                        min="1"
                    />
                </div>
                {/* Кількість глав */}
                <div className="create-book__group">
                    <label className="create-book__label">Кількість глав:</label>
                    <input
                        type="number"
                        className="create-book__input"
                        value={book?.chapters || 0}
                        onChange={(e) => setBook({ ...book, chapters: parseInt(e.target.value) })}
                        min="0"
                    />
                </div>
                {/* Екстри */}
                <div className="create-book__group">
                    <label className="create-book__label">Екстри:</label>
                    <input
                        type="number"
                        className="create-book__input"
                        value={book?.extras || 0}
                        onChange={(e) => setBook({ ...book, extras: parseInt(e.target.value) })}
                        min="0"
                    />
                </div>

                {/* Опис */}
                <div className="create-book__group">
                    <label className="create-book__label">Опис книги:</label>
                    <textarea
                        className="create-book__textarea"
                        value={book?.description || ""}
                        placeholder="Введіть короткий опис..."
                        onChange={(e) => setBook({ ...book, description: e.target.value })}
                    />
                </div>
                
                {/* Текст */}
                <div className="create-book__group">
                    <label className="create-book__label">
                        Текст:
                    </label>

                    <label className="create-book__file">

                        <span className="create-book__file-btn">
                            Вибрати файл
                        </span>

                        <span className="create-book__file-name">
                                {text ? text.name : "Файл не вибраний"}
                            </span>

                            <input
                                type="file"
                                accept=".epub,application/epub+zip"
                                onChange={(e) => setText(e.target.files[0])}
                            />
                    </label>
                </div>

                <button type="submit" className="create-book__submit-btn">
                    {mode === "edit" ? "Зберегти зміни" : "Створити книгу"}
                </button>
            </form>
        </div>
    );
}

export default CreateBookPage;