import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { requestWithRefresh } from "../api/requestWithRefresh";
import BookCard from "../cards/BookCard";
import Comment from "../components/Comment";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import '../styles/pages/_book-page.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

function BookPage() {
    // Дані находяться в URL
    const { id } = useParams();
    const navigate = useNavigate();

    // Декодуємо токен для отримання інформації про користувача
    const token = localStorage.getItem("token");
    let currentUser = null;
    if (token) {
        try {
            currentUser = jwtDecode(token);
        } catch (e) {
            console.error("Невалідний токен:", e);
        }
    }
    const isAdmin = currentUser?.admin === true;

    const [book, setBook] = useState(null);
    const [genres, setGenres] = useState([]);
    const [books, setBooks] = useState([]);
    const [recommendations, setRecommendations] = useState([]);
    const [userStatus, setUserStatus] = useState("");
    const [userRating, setUserRating] = useState(0);
    const [bookRating, setBookRating] = useState(0);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");

    const getInfoOfBook = async (bookId) => {
        try {
            const res = await requestWithRefresh(
                `http://localhost:5000/api/book/${bookId}`
            );
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message);
            }
            return data.bookInfo;
        } catch (err) {
            console.error("Помилка завантаження книги:", err);
            return null;
        }
    };

    // Отримуємо жанри книги
    const getGenresOfBook = async (bookId) => {
        try {
            const res = await requestWithRefresh(
                `http://localhost:5000/api/genres/${bookId}`
            );
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message);
            }
            return data.genres || [];
        } catch (err) {
            console.error("Помилка завантаження жанрів:", err);
            return [];
        }
    };

    useEffect(() => {
        const fetchBookAndGenres = async () => {
            const bookInfo = await getInfoOfBook(id);
            if (bookInfo) {
                setBook(bookInfo);
            }

            const genresInfo = await getGenresOfBook(id);
            setGenres(genresInfo);
        };
        fetchBookAndGenres();
    }, [id]);

    // При рекомендаціях
    const loadFullBookInfo = async (bookId) => {
        const b = await getInfoOfBook(bookId);
        const g = await getGenresOfBook(bookId);
        return { ...b, genres: g || [] };
    };

    // Рекомендації
    // Отримуємо всі книги для рекомендацій
    useEffect(() => {
        const fetchBooks = async () => {
            try {
                const res = await requestWithRefresh(
                    "http://localhost:5000/api/books"
                );
                const data = await res.json();
                if (res.ok) {
                    setBooks(data.books || []);
                }
            } catch (err) {
                console.error("Помилка при отриманні книг:", err);
            }
        };
        fetchBooks();
    }, []);

    // Для рекомендацій: функція, яка обчислює "схожість" між поточною книгою та іншими книгами
    function calculateScore(current, novel) {
        let score = 0;
        const currentGenres = current.genres || [];
        const novelGenres = novel.genres || [];
        const currentAuthors = current.author || [];
        const novelAuthors = novel.author || [];

        // Жанри
        for (const genre of currentGenres) {
            if (novelGenres.some((g) => g.id === genre.id)) {
                score += 5;
            }
        }
        // Автор
        if (currentAuthors.some((a) => novelAuthors.some((b) => b.id === a.id))) {
            score += 10;
        }
        // Схожа кількість глав
        if (current.chapters && novel.chapters && Math.abs(current.chapters - novel.chapters) < 300) {
            score += 1;
        }

        return score;
    }

    useEffect(() => {
        const loadRecommendations = async () => {
            if (!book || books.length === 0) {
                return;
            }

            // Отримуємо повну інформацію про всі книги
            const fullBooks = await Promise.all(
                books.map(async (b) => await loadFullBookInfo(b.id))
            );

            const validBooks = fullBooks.filter((b) => b && b.id);
            const currentBook = validBooks.find((b) => b.id === book.id);
            if (!currentBook) {
                return;
            }

            const recs = validBooks
                .filter((novel) => novel.id !== currentBook.id)
                .map((novel) => ({
                    ...novel,
                    score: calculateScore(currentBook, novel),
                }))
                .sort((a, b) => b.score - a.score)
                .slice(0, 10);

            setRecommendations(recs);
        };

        loadRecommendations();
    }, [book, books]);

    // Функція для видалення книги
    const handleDeleteBook = async (bookId) => {
        if (!window.confirm("Ви впевнені, що хочете видалити цю книгу?")) {
            return;
        }
        try {
            const res = await requestWithRefresh(
                `http://localhost:5000/api/book/delete/${bookId}`, 
                {
                    method: "DELETE",
                }
            );
            if (res.ok) {
                alert("Книга успішно видалена.");
                navigate("/books");
            } else {
                const errorData = await res.json();
                alert(`Не вдалося видалити книгу: ${errorData.message}`);
            }
        } catch (err) {
            console.error("Критична помилка при видаленні:", err);
        }
    };

    // Завантаження статусу
    useEffect(() => {
        const fetchUserStatus = async () => {
            const currentToken = localStorage.getItem("token");
            if (!currentToken || !id) {
                return; // Не робимо запит, якщо немає токена або ID книги
            }

            try {
                const decoded = jwtDecode(currentToken);
                const res = await requestWithRefresh(
                    `http://localhost:5000/api/watchlist/${decoded.userId}/${id}`
                );
                if (res.ok) {
                    const data = await res.json();
                    setUserStatus(data.watchlist?.status || "");
                }
            } catch (err) {
                console.error("Помилка завантаження статусу користувача:", err);
            }
        };

        fetchUserStatus();
    }, [id]); // Залежність тільки від ID книги з URL

    const handleStatusChange = async (newStatus) => {
        const currentToken = localStorage.getItem("token");
        if (!currentToken) {
            return;
        }

        try {
            const decoded = jwtDecode(currentToken);
            const res = await requestWithRefresh(
                `http://localhost:5000/api/watchlist/update`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        user_id: decoded.userId,
                        book_id: id,
                        status: newStatus,
                    }),
                }
            );
            if (res.ok) {
                setUserStatus(newStatus);
            }
        } catch (err) {
            console.error("Помилка оновлення статусу:", err);
        }
    };

    // Оцінка
    useEffect(() => {
        const fetchUserRating = async () => {
            const currentToken = localStorage.getItem("token");
            if (!currentToken || !id) {
                return;
            }

            try {
                const decoded = jwtDecode(currentToken);
                const res = await requestWithRefresh(
                    `http://localhost:5000/api/rating/${decoded.userId}/${id}`
                );

                if (res.ok) {
                    const data = await res.json();
                    console.log("Відповідь рейтингу:", data);
                    console.log("Рейтинг користувача:", data.rating?.user_rating);
                    console.log("Середній рейтинг:", data.rating?.average_rating);
                    setUserRating(data.rating?.user_rating || 0);
                    setBookRating(Number(data.rating?.average_rating) || 0);
                }
            } catch (err) {
                console.error("Помилка завантаження рейтингу:", err);
            }
        };

        fetchUserRating();
    }, [id]);

    const handleRating = async (rating) => {
        const currentToken = localStorage.getItem("token");

        if (!currentToken) {
            return;
        }

        try {
            const decoded = jwtDecode(currentToken);

            // Если нажали на уже выбранную звезду — удаляем оценку
            const newRating = userRating === rating ? 0 : rating;

            const res = await requestWithRefresh(
                "http://localhost:5000/api/rating/update",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        user_id: decoded.userId,
                        book_id: id,
                        rate: newRating,
                    }),
                }
            );

            const data = await res.json();

            console.log("Ответ после оценки:", data);

            if (res.ok) {
                setUserRating(Number(data.rating?.user_rating) || 0);
                setBookRating(Number(data.rating?.average_rating) || 0);
            } else {
                alert(data.message);
            }
        } catch (err) {
            console.error("Помилка оцінювання:", err);
        }
    };

    // Коментарі
    const handleAddComment = async () => {
        if (!newComment.trim()) {
            return;
        }

        try {
            // Отримуємо актуальний токен з localStorage
            const currentToken = localStorage.getItem("token");
            if (!currentToken) {
                return;
            }

            // Декодуємо ID користувача (можна зробити це безпосередньо перед запитом)
            const decoded = jwtDecode(currentToken);

            // Використовуємо функцію-обгортку замість звичайного fetch
            const res = await requestWithRefresh(
                `http://localhost:5000/api/comments`, 
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        parent_id: null,
                        author_id: decoded.userId,
                        book_id: id,
                        text: newComment,
                    }),
                }
            );
            // Обробка відповіді
            if (res.ok) {
                const data = await res.json();

                // Оновлюємо стейт коментарів (новий коментар йде на початок списку)
                setComments((prev) => [data.comment, ...prev]);

                // Очищуємо поля
                setNewComment("");
            } else {
                const errorData = await res.json();
                console.error("Помилка сервера:", errorData.message);
                alert(`Не вдалося додати коментар: ${errorData.message}`);
            }
        } catch (err) {
            console.error("Критична помилка при відправці:", err);
            if (err.message?.includes("Invalid token")) {
                localStorage.removeItem("token");
                navigate("/login");
            }
        }
    };

    useEffect(() => {
        const fetchComments = async () => {
            try {
                const res = await requestWithRefresh(
                    `http://localhost:5000/api/comments/book/${id}`
                );
                const data = await res.json();

                if (res.ok) {
                    setComments(data.comments || []);
                } else {
                    console.error("Сервер повернув помилку:", data.message);
                }
            } catch (err) {
                console.error("Помилка завантаження коментарів:", err);
            }
        };

        fetchComments();
    }, [id]);

    const handleDeleteComment = async (commentId) => {
        try {
            const res = await requestWithRefresh(
                `http://localhost:5000/api/comments/${commentId}`, 
                {
                    method: "DELETE",
                }
            );

            if (res.ok) {
                // Рекурсивна функція для видалення коментаря з будь-якого рівня вкладеності
                const removeById = (list, targetId) => {
                    return list
                        .filter((c) => c.id !== targetId) // Видаляємо, якщо ID збігається
                        .map((c) => ({
                            ...c,
                            replies: c.replies ? removeById(c.replies, targetId) : [], // Шукаємо у відповідях
                        }));
                };

                setComments((prev) => removeById(prev, commentId));
            } else {
                const errorData = await res.json();
                alert(`Помилка видалення: ${errorData.message}`);
            }
        } catch (err) {
            console.error("Помилка при видаленні:", err);
            alert("Не вдалося видалити коментар. Перевірте з'єднання з сервером.");
        }
    };

    const handleUpdateComment = async (commentId, newText) => {
        try {
            const res = await requestWithRefresh(
                `http://localhost:5000/api/comments/${commentId}`, 
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ 
                        text: newText 
                    }), // Відправляємо новий текст
                }
            );

            if (res.ok) {
                const data = await res.json(); 
                const updatedCommentFromServer = data.comment;

                const updateById = (list) => {
                    return list.map((c) => {
                        if (c.id === commentId) {
                            return { 
                                ...updatedCommentFromServer, 
                                replies: c.replies
                            };
                        }

                        if (c.replies && c.replies.length > 0) {
                            return { ...c, replies: updateById(c.replies) };
                        }
                        return c;
                    });
                };
            setComments((prev) => updateById([...prev]));
        }
        else {
                const errorData = await res.json();
                alert(`Помилка: ${errorData.message}`);
            }
        } catch (err) {
            console.error("Помилка при оновленні:", err);
        }
    };

    const handleReplySubmit = async (parentId, replyText) => {
        // Логіка додавання відповіді дуже схожа на додавання нового коментаря, але з parent_id
        if (!replyText.trim()) {
            return;
        }
        try {
            const currentToken = localStorage.getItem("token");
            if (!currentToken) {
                return;
            }
            const decoded = jwtDecode(currentToken);

            const res = await requestWithRefresh(
                `http://localhost:5000/api/comments`, 
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        parent_id: parentId,
                        author_id: decoded.userId,
                        book_id: id,
                        text: replyText,
                    }),
                }
            );

            // Обробка відповіді
            if (res.ok) {
                const data = await res.json();
                const newReply = data.comment;

                // Створюємо функцію для пошуку батька та вставки відповіді
                const insertReply = (list, pId, reply) => {
                    return list.map((c) => {
                        if (c.id === pId) {
                            // Знайшли батька — додаємо відповідь у початок або кінець його списку replies
                            return {
                                ...c,
                                replies: [reply, ...(c.replies || [])],
                            };
                        }
                        // Якщо у цього коментаря є свої відповіді, шукаємо в них (рекурсія)
                        if (c.replies && c.replies.length > 0) {
                            return {
                                ...c,
                                replies: insertReply(c.replies, pId, reply),
                            };
                        }
                        return c;
                    });
                };

                setComments((prev) => {
                    // Якщо parent_id немає — це основний коментар, додаємо в корінь
                    if (!parentId) {
                        return [newReply, ...prev];
                    }
                    // Якщо є parent_id — шукаємо куди вставити
                    return insertReply(prev, parentId, newReply);
                });

                // Очищення полів (якщо потрібно)
                setNewComment("");
            } else {
                const errorData = await res.json();
                console.error("Помилка сервера:", errorData.message);
                alert(`Не вдалося додати коментар: ${errorData.message}`);
            }
        } catch (err) {
            console.error("Критична помилка при відправці:", err);
            if (err.message?.includes("Invalid token")) {
                localStorage.removeItem("token");
                navigate("/login");
            }
        }
    };

    if (!book) {
        return (
            <div className="page-book">
                <div className="no-results">
                    <p>На жаль, такої книги не існує.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page-book">
            <div className="page-book__info">
                <div className="page-book__info__preview">
                    <img src={book?.preview} loading="lazy" alt={book?.ukrainian_name || "Обкладинка"} className="page-book__book-preview" />
                </div>
                <div className="page-book__info__info">
                    <h3 className="page-book__info__book-title">{book?.ukrainian_name}</h3>
                    <h3 className="page-book__info__book-title">{book?.original_name}</h3>
                    <div className="page-book__rating-display">
                        <div className="page-book__stars">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <i
                                    key={star}
                                    className={`fas fa-star ${star <= userRating ? "active" : ""}`}
                                    onClick={() => handleRating(star)}
                                ></i>
                            ))}
                        </div>

                        <span className="page-book__rating-value">
                            {Number(bookRating || 0).toFixed(1)} / 5
                        </span>
                    </div>
                    <p className="page-book__info__book-info">
                        {book?.author?.length > 1 ? "Автори: " : "Автор: "}
                        {book?.author?.map((a, index) => (
                            <span key={a.id || index} className="page-book__info__author" onClick={() => navigate(`/writer/${a.id}`)}>
                                {a.full_name}
                                {index < book.author.length - 1 && ", "}
                            </span>
                        ))}
                    </p>
                    <p className="page-book__info__book-info">Рік випуску: {book?.year}</p>
                    <p className="page-book__info__book-info">
                        Статус перекладу:{" "}
                        <span className={`page-book__info__book-info ${book?.status === 'В процесі' ? 'status_process' : 'status_finish'}`}>
                            {book?.status}
                        </span>
                    </p>
                </div>
                <div className="page-book__actions">
                    {/* Кнопка читання - рендериться тільки якщо є текст */}
                    {book?.text ? (
                        <button
                            className="page-book__read-btn"
                            onClick={() => navigate(`/book/reading/${book.id}`)}
                        >
                            <i className="fas fa-book-open"></i> Читати онлайн
                        </button>
                    ) : (
                        <button className="page-book__read-btn page-book__read-btn--disabled" disabled title="Текст ще не додано">
                            <i className="fas fa-hourglass-start"></i> Очікується текст
                        </button>
                    )}

                    <div className="page-book__status-container" style={{ marginTop: "15px" }}>
                        <select
                            value={userStatus}
                            onChange={(e) => handleStatusChange(e.target.value)}
                            className="page-book__status-select"
                        >
                            <option value="">Додати до списку</option>
                            <option value="Заплановано">Заплановано</option>
                            <option value="В процесі">В процесі</option>
                            <option value="Прочитано">Прочитано</option>
                        </select>
                    </div>

                    {/* Адмін-панель керування */}
                    {isAdmin && (
                        <div className="page-book__admin-controls">
                            <button
                                className="page-book__control-btn page-book__control-btn--edit"
                                onClick={() => navigate(`/upload/book/${book.id}`, { state: { mode: "edit" } })}
                                title="Редагувати"
                            >
                                <i className="fas fa-edit"></i>
                            </button>
                            <button
                                className="page-book__control-btn page-book__control-btn--delete"
                                onClick={() => handleDeleteBook(book.id)}
                                title="Видалити"
                            >
                                <i className="fas fa-trash"></i>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="page-book__info__genres">
                {genres?.map((genre, index) => (
                    <button
                        key={genre.id || index}
                        className="page-book__info__genres_text"
                        onClick={() => navigate(`/books?genres=${genre.id}`)}
                    >
                        {genre.genre}
                    </button>
                ))}
            </div>

            <div className="page-book__info__description">
                <p className="page-book__info__desc_text">{book?.description}</p>
            </div>

            <div className="page-book__recommendations">
                <h3 className="page-book__recommendations-title">Рекомендовані книги</h3>
                {/* Стрілочки для навігації та точки для сторінок + адаптивність під розмірі екрану */}
                <Swiper
                    modules={[Navigation, Pagination]}
                    navigation={true}
                    pagination={{ clickable: true }}
                    spaceBetween={20}
                    preventClicksPropagation={false}
                    slideToClickedSlide={false}
                    breakpoints={{
                        0: { slidesPerView: 1 },
                        768: { slidesPerView: 2 },
                        1200: { slidesPerView: 5 },
                    }}
                >
                    {recommendations.map((rec) => (
                        <SwiperSlide key={rec.id}>
                            <BookCard
                                id={rec.id}
                                preview={rec.preview}
                                ukrainian_name={rec.ukrainian_name}
                                author={rec.author?.map((a) => a.full_name).join(", ")}
                            />
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>

            <div className="page-book__comments">
                <h3 className="page-book__comments-title">Коментарі</h3>
                {/* Поле створення нового коментаря */}
                <div className="page-book__comment-create">
                    <textarea
                        className="page-book__comment__input"
                        placeholder="Залишити відгук про книгу..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                    />
                    <button className="page-book__comment__send-main" onClick={handleAddComment}>
                        Надіслати коментар
                    </button>
                </div>
                {comments.map((c) => (
                    <Comment
                        key={c.id}
                        comment={c}
                        onReplySubmit={handleReplySubmit}
                        onDelete={handleDeleteComment}
                        onUpdate={handleUpdateComment}
                    />
                ))}
            </div>
        </div>
    );
}

export default BookPage;