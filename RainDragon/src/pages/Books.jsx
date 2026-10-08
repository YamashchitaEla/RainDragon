import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { requestWithRefresh } from "../api/requestWithRefresh";
import BookCard from "../cards/BookCard";
import '../styles/pages/_books.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

function Books() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [allBooks, setAllBooks] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [genresList, setGenresList] = useState([]);
    const [selectedGenres, setSelectedGenres] = useState([]);
    const currentPage = Number(searchParams.get("page")) || 1;
    const booksPerPage = 12;

    const token = localStorage.getItem("token");
    const currentUser = jwtDecode(token);
    const isAdmin = currentUser.admin === true;

    // Якщо в url жанр, то додаємо (натискання у блоці жанрів книги також сюди)
    useEffect(() => {
        const genresParam = searchParams.get("genres");
        if (genresParam) {
            setSelectedGenres(
                genresParam
                    .split(",")
                    .map(Number)
                    .filter(Boolean)
            );
        } else {
            setSelectedGenres([]);
        }
    }, [searchParams]);

    const handleGenreChange = (genreId) => {
        const newGenres = selectedGenres.includes(genreId)
            ? selectedGenres.filter(id => id !== genreId)
            : [...selectedGenres, genreId];
        const params = new URLSearchParams(searchParams);

        if (newGenres.length > 0) {
            params.set("genres", newGenres.join(","));
        } else {
            params.delete("genres");
        }

        // При зміні фільтру починаємо з 1 сторінки
        params.set("page", "1");

        setSearchParams(params);
    };

    // Завантажуємо жанри ОДИН раз при монтуванні
    useEffect(() => {
        const fetchGenres = async () => {
            try {
                const res = await requestWithRefresh("http://localhost:5000/api/genres");
                const data = await res.json();
                if (res.ok) setGenresList(data.genres || []);
            } catch (err) { 
                console.error(err); 
            }
        };
        fetchGenres();
    }, []);

    // Завантажуємо книги щоразу, коли змінюється selectedGenres
    useEffect(() => {
        const fetchBooks = async () => {
            try {
                let url = "http://localhost:5000/api/books";

                if (selectedGenres.length > 0) {
                    url += `?genres=${selectedGenres.join(",")}`;
                }

                const res = await requestWithRefresh(url);
                const data = await res.json();

                if (res.ok) {
                    setAllBooks(data.books || []);
                }
            } catch (err) {
                console.error("Помилка завантаження книг:", err);
            }
        };

        fetchBooks();
    }, [selectedGenres]);

    // Фільтрація
    const filteredBooks = useMemo(() => {
        return allBooks.filter(book =>
            book.ukrainian_name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, allBooks]);

    // Пагінація
    const totalPages = Math.ceil(filteredBooks.length / booksPerPage);

    // Визначення книг для поточної сторінки
    const currentBooks = useMemo(() => {
        const lastIndex = currentPage * booksPerPage;
        const firstIndex = lastIndex - booksPerPage;
        return filteredBooks.slice(firstIndex, lastIndex);
    }, [currentPage, filteredBooks]);

    // Обробник зміни сторінки
    const handlePageChange = (pageNumber) => {
        const params = new URLSearchParams(searchParams);
        params.set("page", pageNumber);
        setSearchParams(params);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    useEffect(() => {
        const search = searchParams.get("search") || "";
        setSearchTerm(search);
    }, [searchParams]);

    return (
        <div className="books-page">
            <header className="books-header">
                <h1 className="books-title">Бібліотека</h1>

                <div className="search-container">
                    <i className="fas fa-search search-icon"></i>
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Пошук за назвою..."
                        value={searchTerm}
                        onChange={(e) => {
                        const value = e.target.value;
                        setSearchTerm(value);
                        const params = new URLSearchParams(searchParams);

                        if (value) {
                            params.set("search", value);
                        } else {
                            params.delete("search");
                        }

                        params.set("page", "1");
                        setSearchParams(params);
                    }}
                    />
                </div>

                <div className="genres-list">
                    <button
                        className={`genre-badge ${selectedGenres.length === 0 ? 'active' : ''}`}
                        onClick={() => {
                            const params = new URLSearchParams(searchParams);
                            params.delete("genres");
                            params.set("page", "1");
                            setSearchParams(params);
                        }}
                    >
                        Усі жанри
                    </button>
                    {genresList.map(genre => (
                        <button
                            key={genre.id}
                            className={`genre-badge ${selectedGenres.includes(genre.id) ? 'active' : ''}`}
                            onClick={() => handleGenreChange(genre.id)}
                        >
                            {genre.genre}
                        </button>
                    ))}
                </div>
            </header>

            <div className="books-grid">
                {currentBooks.length > 0 ? (
                    currentBooks.map(book => (
                        <BookCard
                            key={book.id}
                            id={book.id}
                            preview={book.preview}
                            ukrainian_name={book.ukrainian_name}
                            author={book.author.map(a => a.full_name).join(", ")}
                        />
                    ))
                ) : (
                    <div className="no-results">
                        <p>На жаль, за вашим запитом нічого не знайдено.</p>
                    </div>
                )}
            </div>

            {totalPages > 1 && (
                <div className="pagination">
                    <button disabled={currentPage === 1} onClick={() => handlePageChange(currentPage - 1)} className="page-btn">
                        <i className="fas fa-chevron-left"></i>
                    </button>

                    {[...Array(totalPages)].map((_, index) => (
                        <button
                            key={index + 1}
                            onClick={() => handlePageChange(index + 1)}
                            className={`page-btn ${currentPage === index + 1 ? 'active' : ''}`}
                        >
                            {index + 1}
                        </button>
                    ))}

                    <button disabled={currentPage === totalPages} onClick={() => handlePageChange(currentPage + 1)} className="page-btn">
                        <i className="fas fa-chevron-right"></i>
                    </button>
                </div>
            )}
            {/* Кнопка додавання */}
            {isAdmin && (
                <button
                    className="page-books__btn--add"
                    onClick={() => navigate(`/upload/book/`, { state: { mode: "create" } })}
                    title="Додати нову книгу"
                >
                    <i className="fas fa-plus"></i>
                </button>
            )}
        </div>
    );
}

export default Books;