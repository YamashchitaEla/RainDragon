import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { requestWithRefresh } from "../api/requestWithRefresh";
import BookCard from "../cards/BookCard";
import '../styles/pages/_main.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

function MainPage() {
    const [books, setBooks] = useState([]);
    useEffect(() => {
        const fetchBooks = async () => {
            try {
                const res = await requestWithRefresh(
                    "http://localhost:5000/api/books_latest"
                );

                const data = await res.json();
                if (res.ok) {
                    setBooks(data.latestBooks || []);
                } else {
                    console.error("Сервер повернув помилку:", data.message);
                }
            } catch (err) {
                console.error("Помилка завантаження книг:", err);
            }
        };

        fetchBooks(); // не забудь викликати функцію
    }, []); // порожній масив => виконається один раз при монтуванні 

    const [topBooks, setTopBooks] = useState([]);
    useEffect(() => {
        const fetchBooks = async () => {
            try {
                const res = await requestWithRefresh(
                    "http://localhost:5000/api/books_top"
                );

                const data = await res.json();
                if (res.ok) {
                    setTopBooks(data.topBooks || []);
                } else {
                    console.error("Сервер повернув помилку:", data.message);
                }
            } catch (err) {
                console.error("Помилка завантаження книг:", err);
            }
        };

        fetchBooks(); 
    }, []); 

    const navigate = useNavigate();

    return (
        <div className="main-page">
            <div className="welcome-banner">
                <div className="gradient"></div>
                <div className="welcome-text">
                    <h1 id="welcome-title">Ласкаво просимо до RainDragon!</h1>
                    <p className="welcome-subtitle">Кожна новела — як портал у інший світ та неймовірні пригоди. Від героїв, що підкорюють вершини, до тих, що знаходять сенс у дружбі та коханні — тут є все, що змушує повертатися за новими розділами.</p>
                    <p className="welcome-subtitle">Зберігай, відкривай, досліджуй — нехай дракон веде твій шлях крізь ці незабутні світи.</p>
                </div>
                <img id="dragon" src={"/dragon_v2.png"} loading="lazy" alt="Дракон" ></img>
            </div>
            <h1 className="news-title">Останні новинки</h1>
            <div className="news-section">
                {books.map(book => (
                    <BookCard
                        let key={book.id}
                        preview={book.preview}
                        ukrainian_name={book.ukrainian_name}
                        author={book.author.map(a => a.full_name).join(", ")}
                        id={book.id}
                    />
                ))}
            </div>
            <h1 className="top-title">Найпопулярніше</h1>
            <div className="top-section">
                {topBooks.map(book => (
                    <BookCard
                        let key={book.id}
                        preview={book.preview}
                        ukrainian_name={book.ukrainian_name}
                        author={book.author.map(a => a.full_name).join(", ")}
                        id={book.id}
                    />
                ))}
            </div>
        </div>
    );
}

export default MainPage;