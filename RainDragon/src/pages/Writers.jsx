import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { requestWithRefresh } from "../api/requestWithRefresh";
import WriterCard from "../cards/WriterCard";
import '../styles/pages/_writers.css'; 
import '@fortawesome/fontawesome-free/css/all.min.css';

function Writers() {
    const navigate = useNavigate();
    
    const [allWriters, setAllWriters] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const writersPerPage = 12;

    const token = localStorage.getItem("token");
    const currentUser = token ? jwtDecode(token) : { admin: false };
    const isAdmin = currentUser.admin === true;

    // Завантаження авторів
    useEffect(() => {
        const fetchWriters = async () => {
            try {
                const res = await requestWithRefresh(
                    "http://localhost:5000/api/writers"
                );
                const data = await res.json();
                if (res.ok) {
                    setAllWriters(data.writers || []);
                }
            } catch (err) {
                console.error("Помилка завантаження авторів:", err);
            }
        };
        fetchWriters();
    }, []);

    // Фільтрація
    const filteredWriters = useMemo(() => {
        return allWriters.filter(writer =>
            writer.full_name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, allWriters]);

    // Пагінація
    const totalPages = Math.ceil(filteredWriters.length / writersPerPage);

    // Визначення авторів для поточної сторінки
    const currentWriters = useMemo(() => {
        const lastIndex = currentPage * writersPerPage;
        const firstIndex = lastIndex - writersPerPage;
        return filteredWriters.slice(firstIndex, lastIndex);
    }, [currentPage, filteredWriters]);

    // Обробник зміни сторінки
    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Скидання поточної сторінки при зміні пошукового запиту
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    return (
        <div className="writers-page"> 
            <header className="writers-header">
                <h1 className="writers-title">Автори</h1>

                <div className="writer-search-container">
                    <i className="fas fa-search writer-search-icon"></i>
                    <input
                        type="text"
                        className="writer-search-input"
                        placeholder="Пошук за ім'ям автора..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </header>

            <div className="writers-grid"> 
                {currentWriters.length > 0 ? (
                    currentWriters.map(writer => (
                        <WriterCard
                            key={writer.id}
                            id={writer.id}
                            full_name={writer.full_name}
                            birthday={writer.birthday || "Не вказано"}
                        />
                    ))
                ) : (
                    <div className="no-results">
                        <p>Авторів за таким запитом не знайдено.</p>
                    </div>
                )}
            </div>

            {totalPages > 1 && (
                <div className="writer-pagination">
                    <button 
                        disabled={currentPage === 1} 
                        onClick={() => handlePageChange(currentPage - 1)} 
                        className="writer-page-btn"
                    >
                        <i className="fas fa-chevron-left"></i>
                    </button>

                    {[...Array(totalPages)].map((_, index) => (
                        <button
                            key={index + 1}
                            onClick={() => handlePageChange(index + 1)}
                            className={`writer-page-btn ${currentPage === index + 1 ? 'active' : ''}`}
                        >
                            {index + 1}
                        </button>
                    ))}

                    <button 
                        disabled={currentPage === totalPages} 
                        onClick={() => handlePageChange(currentPage + 1)} 
                        className="writer-page-btn"
                    >
                        <i className="fas fa-chevron-right"></i>
                    </button>
                </div>
            )}

            {isAdmin && (
                <button
                    className="page-writers__btn--add"
                    onClick={() => navigate(`/upload/writer/`, { state: { mode: "create" } })}
                    title="Додати автора"
                >
                    <i className="fas fa-plus"></i>
                </button>
            )}
        </div>
    );
}

export default Writers;