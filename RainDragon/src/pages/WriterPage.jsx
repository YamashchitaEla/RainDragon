import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { requestWithRefresh } from "../api/requestWithRefresh";
import BookCard from "../cards/BookCard";
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import '../styles/pages/_writer-page.css';

function WriterPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    dayjs.extend(utc);

    const [writer, setWriter] = useState(null);
    const [writerBooks, setWriterBooks] = useState([]);
    const [isAdmin, setIsAdmin] = useState(false); // Стан для адміна

    // Перевірка ролі при завантаженні або зміні токена
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            try {
                const decoded = jwtDecode(token);
                // Припускаємо, що в токені роль лежить у полі role
                if (decoded.admin === true) {
                    setIsAdmin(true);
                }
            } catch (err) {
                console.error("Помилка декодування токена:", err);
            }
        }
    }, []);

    // Отримуємо токен з localStorage і декодуємо його, щоб перевірити роль користувача
    useEffect(() => {
        const fetchWriterData = async () => {
            try {
                const writerRes = await requestWithRefresh(`http://localhost:5000/api/writer/${id}`);
                const writerData = await writerRes.json();
                if (writerRes.ok) {
                    setWriter(writerData.writerInfo);
                }

                const booksRes = await requestWithRefresh(`http://localhost:5000/api/books/writer/${id}`);
                const booksData = await booksRes.json();
                if (booksRes.ok) {
                    setWriterBooks(booksData.books || []);
                }
            } catch (err) {
                console.error("Помилка завантаження профілю автора:", err);
            }
        };

        fetchWriterData();
    }, [id]);

    // Обробник видалення автора
    const handleDeleteWriter = async (writerId) => {
        if (!window.confirm("Ви впевнені, що хочете видалити цього автора?")) return;
        try {
            const res = await requestWithRefresh(`http://localhost:5000/api/writer/delete/${writerId}`, {
                method: "DELETE",
            });
            if (res.ok) {
                alert("Автор успішно видален.");
                navigate("/writers");
            } else {
                const errorData = await res.json();
                console.error("Помилка сервера:", errorData.message);
                alert(`Не вдалося видалити автора: ${errorData.message}`);
            }
        } catch (err) {
            console.error("Критична помилка при видаленні:", err);
        }
    };

    if (!writer) {
        return (
            <div className="writer-page">
                <div className="no-results">
                    <p>На жаль, такого автора не існує.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="writer-page">
            <div className="writer-header">
                <div className="writer-header__info">
                    <h2 className="writer-header__name">
                        {writer.full_name}
                    </h2>

                    <div className="writer-header__details">
                        <p><strong><i className="fas fa-birthday-cake"></i> Дата народження:</strong> {writer.birthday}</p>
                    </div>
                </div>
                {isAdmin && (
                    <div className="page-writer__admin-controls">
                        <button
                            className="page-writer__control-btn page-writer__control-btn--edit"
                            onClick={() => navigate(`/upload/writer/${writer.id}`, { state: { mode: "edit" } })}
                            title="Редагувати"
                            >
                            <i className="fas fa-edit"></i>
                        </button>
                        <button
                            className="page-writer__control-btn page-writer__control-btn--delete"
                            onClick={() => handleDeleteWriter(writer.id)}
                            title="Видалити"
                            >
                            <i className="fas fa-trash"></i>
                        </button>
                    </div>
                )}
            </div>

            <div className="writer-content">
                <h3 className="writer-content__title">
                    <i className="fas fa-book"></i> Бібліографія ({writerBooks.length})
                </h3>

                {writerBooks.length > 0 ? (
                    <div className="writer-content__list">
                        {writerBooks.map(book => (
                            <BookCard
                                key={book.id}
                                preview={book.preview}
                                ukrainian_name={book.ukrainian_name}
                                author={book.author.map(a => a.full_name).join(", ")}
                                id={book.id}
                            />
                        ))}
                    </div>
                ) : (
                    <p className="writer-content__empty">У цього автора поки немає опублікованих книг.</p>
                )}
            </div>
        </div>
    );
}

export default WriterPage;