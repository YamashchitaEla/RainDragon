import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import PostEditor from "../components/PostEditor";
import { requestWithRefresh } from "../api/requestWithRefresh";
import "../styles/pages/_create-post.css";

function CreatePostPage() {
    const { id } = useParams(); // Отримуємо ID з URL
    const navigate = useNavigate();
    const location = useLocation();

    // Визначаємо режим на основі наявності ID або переданого стану
    const mode = location.state?.mode || (id ? "edit" : "create");

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

    const [post, setPost] = useState(null);
    
    const [preview, setPreview] = useState(null);
    const [published, setPublished] = useState(false); 

    // Список тегів + обраних для вибору
    const [tagsList, setTagsList] = useState([]);
    const [selectedTags, setSelectedTags] = useState([]);

    // Завантаження даних поста при редагуванні
    useEffect(() => {
        if (mode === "edit" && id) {
            const fetchPostData = async () => {
                try {
                    const res = await requestWithRefresh(
                        `http://localhost:5000/api/post/${id}`
                    );
                    if (res.ok) {
                        const data = await res.json();
                        const postData = data.postInfo || null;
                        setPost(postData);
                        if (postData) {
                            setPublished(postData.published);
                        }
                        if (postData.author.id != currentUser.userId) {
                            alert("У вас немає прав для доступу до цієї сторінки.");
                            window.location.href = "/posts";
                            return;
                        }
                    }
                } catch (err) {
                    console.error("Помилка завантаження даних поста:", err);
                }
            };
            fetchPostData();
        }
    }, [id, mode]);

    // Завантаження тегів посту
    useEffect(() => {
        if (mode === "edit" && post) {
            const fetchPostTags = async () => {
                try {
                    const res = await requestWithRefresh(
                        `http://localhost:5000/api/tags/${post.id}`, 
                        {
                            method: "GET"
                        }
                    );
                    if (res.ok) {
                        const data = await res.json();
                        setSelectedTags(data.tags.map(t => t.id));
                    }
                } catch (err) {
                    console.error("Помилка завантаження тегів:", err);
                }
            };
            fetchPostTags();
        }
    }, [post]);

    // Завантаження списків тегів для вибору (для обох режимів)
    useEffect(() => {
        const fetchData = async () => {
            try {
                const tagRes = await requestWithRefresh(
                    "http://localhost:5000/api/tags"
                );
                const tagData = await tagRes.json();

                if (tagData.tags) {
                    setTagsList(tagData.tags);
                }
            } catch (err) {
                console.error("Помилка завантаження списку:", err);
            }
        };
        fetchData();
    }, []);

    // Додавання та видалення
    const handleAddItem = (itemId, setSelected, currentSelected) => {
        if (itemId && !currentSelected.includes(itemId)) {
            setSelected([...currentSelected, itemId]);
        }
    };
    const handleRemoveItem = (itemId, setSelected, currentSelected) => {
        setSelected(currentSelected.filter(item => item !== itemId));
    };

    const handleSubmit = async (e, shouldPublish) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append("title", post?.title || "");
        formData.append("short_description", post?.short_description || "");
        formData.append("content", JSON.stringify(post?.content || {}));

        // Значення береться безпосередньо з кнопки
        formData.append("published", shouldPublish);

        selectedTags.forEach(tagId => {
            formData.append("tags", tagId);
        });

        if (preview) {
            formData.append("preview", preview);
        }

        const url = mode === "edit"
            ? `http://localhost:5000/api/post/update/${id}`
            : "http://localhost:5000/api/post/create";

        const method = mode === "edit" ? "PUT" : "POST";

        try {
            const res = await requestWithRefresh(url, {
                method,
                body: formData
            });

            if (res.ok) {
                const data = await res.json();

                if (shouldPublish === true) {
                    if (mode === "edit") {
                        alert(
                            published
                                ? "Публікацію оновлено!"
                                : "Чернетку опубліковано!"
                        );
                    } else {
                        alert("Публікацію створено!");
                    }
                    navigate(`/post/${id || data.postId}`);
                } else {
                    alert("Додано у чернетки!");
                    navigate("/posts/drafts");
                }
            } else {
                const error = await res.json();
                alert(`Помилка: ${error.message}`);
            }
        } catch (err) {
            console.error("Помилка відправки:", err);
        }
    };

    return (
        <div className="create-post-page">

            {/* Заголовок сторінки */}
            <h2 className="create-post__title">
                {mode === "edit" ? "Редагувати публікацію" : "Створити публікацію"}
            </h2>

            <form className="create-post__form">
                {/* Заголовок публікації */}
                <div className="create-post__group">
                    <label className="create-post__label">
                        Заголовок публікації:
                    </label>
                    <input
                        className="create-post__input"
                        type="text"
                        value={post?.title || ""}
                        onChange={(e) => setPost({...post, title: e.target.value})}
                        placeholder="Введіть заголовок..."
                        required
                    />
                </div>

                {/* Короткий опис */}
                <div className="create-post__group">
                    <label className="create-post__label">
                        Короткий опис публікації:
                    </label>

                    <textarea
                        className="create-post__textarea"
                        value={post?.short_description || ""}
                        onChange={(e) => setPost({...post, short_description: e.target.value})}
                        placeholder="Введіть короткий опис..."
                        required
                    />
                </div>

                {/* Обкладинка */}
                <div className="create-post__group">
                    <label className="create-post__label">
                        Обкладинка:
                    </label>

                    <label className="create-post__file">

                        <span className="create-post__file-btn">
                            Вибрати файл
                        </span>

                        <span className="create-post__file-name">
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
                            className="create-post__preview"
                            src={URL.createObjectURL(preview)}
                            alt="Нове прев'ю"
                        />
                    ) : (
                        post?.preview && (
                            <img
                                className="create-post__preview"
                                src={post.preview}
                                alt="Поточне прев'ю"
                            />
                        )
                    )}
                </div>

                {/* Теги */}
                <div className="create-post__group">

                    <label className="create-post__label">
                        Теги:
                    </label>

                    <select
                        className="create-post__select"
                        onChange={(e) => handleAddItem(Number(e.target.value), setSelectedTags, selectedTags)}
                        value=""
                    >
                        <option value="">-- Додати тег --</option>

                        {tagsList.map(tag => (
                            <option key={tag.id} value={tag.id}>#{tag.tag}</option>
                        ))}
                    </select>
                    <div className="selected-items-tags">
                        {selectedTags.map((tagId, index) => {
                            const tag = tagsList.find( t => t.id === parseInt(tagId));
                            return (
                                <span key={index} className="tag">
                                    #{tag?.tag || "Завантаження..."}
                                    <button type="button" onClick={() => handleRemoveItem(tag.id, setSelectedTags, selectedTags)}>×
                                    </button>
                                </span>
                            );
                        })}
                    </div>
                </div>

                {/* Текст публікації */}
                <div className="create-post__group">
                    <label className="create-post__label">
                        Текст публікації:
                    </label>
                    {mode === "create" || post ? (
                        <PostEditor
                            content={post?.content || ""}
                            onChange={(content) =>
                                setPost(prev => ({
                                    ...prev,
                                    content
                                }))
                            }
                        />
                    ) : null}
                </div>

                {/* Кнопка відправки */}
                <button type="submit" className="create-post__submit-btn_draft" onClick={(e) => handleSubmit(e, false)}>
                    Зберегти у чернетки
                </button>

                <button type="submit" className="create-post__submit-btn_final" onClick={(e) => handleSubmit(e, true)}>
                    {mode === "create" ? "Опублікувати"
                        : published
                            ? "Зберегти зміни"
                            : "Опублікувати"
                    }
                </button>
            </form>
        </div>
    );
}

export default CreatePostPage;