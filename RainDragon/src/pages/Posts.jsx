import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { requestWithRefresh } from "../api/requestWithRefresh";
import PostCard from "../cards/PostCard";
import "../styles/pages/_posts.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

function Posts() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [allPosts, setAllPosts] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [tagsList, setTagsList] = useState([]);
    const [selectedTags, setSelectedTags] = useState([]);
    const currentPage = Number(searchParams.get("page")) || 1;
    const postsPerPage = 8;

    const token = localStorage.getItem("token");
    const currentUser = jwtDecode(token);
    const isAdmin = currentUser.admin === true;

    // Якщо в url тег, то додаємо (натискання у блоці тегов поста)
    useEffect(() => {
        const tagsParam = searchParams.get("tags");

        if (tagsParam) {
            setSelectedTags(
                tagsParam
                    .split(",")
                    .map(Number)
                    .filter(Boolean)
            );
        } else {
            setSelectedTags([]);
        }
    }, [searchParams]);

    const handleTagChange = (tagId) => {
        const newTags = selectedTags.includes(tagId)
            ? selectedTags.filter(id => id !== tagId)
            : [...selectedTags, tagId];
        const params = new URLSearchParams(searchParams);

        if (newTags.length > 0) {
            params.set("tags", newTags.join(","));
        } else {
            params.delete("tags");
        }

        // При зміні фільтру починаємо з 1 сторінки
        params.set("page", "1");

        setSearchParams(params);
    };

    // Завантажуємо теги ОДИН раз при монтуванні
    useEffect(() => {
        const fetchTags = async () => {
            try {
                const res = await requestWithRefresh(
                    "http://localhost:5000/api/tags"
                );
                const data = await res.json();
                if (res.ok) {
                    setTagsList(data.tags || []);
                }
            } catch (err) { 
                console.error(err); 
            }
        };
        fetchTags();
    }, []);

    // Завантажуємо пости щоразу, коли змінюється selectedTags
    useEffect(() => {
        const fetchPosts = async () => {
            try {
                let url = "http://localhost:5000/api/posts";

                if (selectedTags.length > 0) {
                    url += `?tags=${selectedTags.join(",")}`;
                }

                const res = await requestWithRefresh(url);
                const data = await res.json();

                if (res.ok) {
                    setAllPosts(data.posts || []);
                }
            } catch (err) {
                console.error("Помилка завантаження постів:", err);
            }
        };

        fetchPosts();
    }, [selectedTags]);

    // Фільтрація
    const filteredPosts = useMemo(() => {
        return allPosts.filter(post =>
            post.title.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, allPosts]);

    // Пагінація
    const totalPages = Math.ceil(filteredPosts.length / postsPerPage);

    // Визначення книг для поточної сторінки
    const currentPosts = useMemo(() => {
        const lastIndex = currentPage * postsPerPage;
        const firstIndex = lastIndex - postsPerPage;
        return filteredPosts.slice(firstIndex, lastIndex);
    }, [currentPage, filteredPosts]);

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
        <div className="posts-page">
            <header className="posts-header">
                <h1 className="posts-title">
                    Публікації
                </h1>
                <div className="posts-search-container">
                    <i className="fas fa-search posts-search-icon"></i>
                    <input
                        type="text"
                        className="posts-search-input"
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

                <div className="tags-list">
                    <button
                        className={`tag-badge ${selectedTags.length === 0 ? 'active' : ''}`}
                        onClick={() => {
                            const params = new URLSearchParams(searchParams);
                            params.delete("tags");
                            params.set("page", "1");
                            setSearchParams(params);
                        }}
                    >
                        Усі теги
                    </button>
                    {tagsList.map(tag => (
                        <button
                            key={tag.id}
                            className={`tag-badge ${selectedTags.includes(tag.id) ? 'active' : ''}`}
                            onClick={() => handleTagChange(tag.id)}
                        >
                            #{tag.tag}
                        </button>
                    ))}
                </div>
                {isAdmin && (
                    <button className="posts-drafts-btn" onClick={() => navigate("/posts/drafts")}>
                        <i className="fas fa-file-signature"></i>
                        Чернетки
                    </button>
                )}
            </header>

            <div className="posts-grid">
                {currentPosts.length > 0 ? (
                    currentPosts.map(post => (
                        <PostCard
                            key={post.id}
                            id={post.id}
                            preview={post.preview}
                            title={post.title}
                            short_description={post.short_description}
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
                    className="page-posts__btn--add"
                    onClick={() => navigate(`/upload/post/`, { state: { mode: "create" } })}
                    title="Додати новий пост"
                >
                    <i className="fas fa-plus"></i>
                </button>
            )}
        </div>
    );
}

export default Posts;