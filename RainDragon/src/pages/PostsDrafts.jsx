import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { requestWithRefresh } from "../api/requestWithRefresh";
import DraftCard from "../cards/DraftCard";
import "../styles/pages/_posts-drafts.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

function PostsDrafts() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [allDrafts, setAllDrafts] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const currentPage = Number(searchParams.get("page")) || 1;
    const draftsPerPage = 8;

    const token = localStorage.getItem("token");
    const currentUser = jwtDecode(token);
    const isAdmin = currentUser.admin === true;
    // Перевірка на адміна
    useEffect(() => {
        if (!isAdmin) {
            alert("У вас немає прав для доступу до цієї сторінки.");
            window.location.href = "/"; // Перенаправлення на головну сторінку
        }
    }, []);

    const id = currentUser.userId;

    useEffect(() => {
        const fetchDrafts = async (id) => {
            try {
                const res = await requestWithRefresh(`http://localhost:5000/api/posts/drafts/${id}`);
                const data = await res.json();
                if (res.ok) {
                    setAllDrafts(data.drafts || []);
                }
            } catch (err) {
                console.error("Помилка завантаження чернеток:", err);
                return [];
            }
        };
        fetchDrafts(id);
    }, []);

    // Фільтрація
    const filteredDrafts = useMemo(() => {
        return allDrafts.filter(draft =>
            draft.title.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, allDrafts]);

    // Пагінація
    const totalPages = Math.ceil(filteredDrafts.length / draftsPerPage);

    // Визначення книг для поточної сторінки
    const currentDrafts = useMemo(() => {
        const lastIndex = currentPage * draftsPerPage;
        const firstIndex = lastIndex - draftsPerPage;
        return filteredDrafts.slice(firstIndex, lastIndex);
    }, [currentPage, filteredDrafts]);

    // Обробник зміни сторінки
    const handlePageChange = (pageNumber) => {
        const params = new URLSearchParams(searchParams);
        params.set("page", pageNumber);
        setSearchParams(params);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // Скидання поточної сторінки при зміні пошукового запиту
    useEffect(() => {
        const search = searchParams.get("search") || "";
        setSearchTerm(search);
    }, [searchParams]);

    return (
        <div className="drafts-page">
            <header className="drafts-header">
                <h1 className="drafts-title">
                    Ваші чернетки
                </h1>
                <div className="drafts-search-container">
                    <i className="fas fa-search drafts-search-icon"></i>
                    <input
                        type="text"
                        className="drafts-search-input"
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
            </header>

            <div className="drafts-grid">
                {currentDrafts.length > 0 ? (
                    currentDrafts.map(draft => (
                        <DraftCard
                            key={draft.id}
                            id={draft.id}
                            preview={draft.preview}
                            title={draft.title}
                            short_description={draft.short_description}
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
                    className="page-drafts__btn--add"
                    onClick={() => navigate(`/upload/post/`, { state: { mode: "create" } })}
                    title="Додати новий пост"
                >
                    <i className="fas fa-plus"></i>
                </button>
            )}
        </div>
    );
}

export default PostsDrafts;