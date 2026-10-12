import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { requestWithRefresh } from "../api/requestWithRefresh";
import PostContent from "../components/PostContent";
import Comment from "../components/Comment";
import "../styles/pages/_post-page.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

function PostPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const { currentUser, isAdmin } = useAuth();
    const isLoggedIn = Boolean(currentUser);
    const [post, setPost] = useState(null);
    const isOwner = currentUser && String(currentUser.userId) === String(post?.author?.id);

    const [tags, setTags] = useState([]);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");

    // Завантаження даних
    const getInfoOfPost = async (postId) => {
        try {
            const res = await fetch(
                `http://localhost:5000/api/post/${postId}`
            );
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message);
            }
            return data.postInfo;
        } catch (err) {
            console.error("Помилка завантаження книги:", err);
            return null;
        }
    };

    const getTagsOfPost = async (postId) => {
        try {
            const res = await fetch(
                `http://localhost:5000/api/tags/${postId}`
            );
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message);
            }
            return data.tags || [];
        } catch (err) {
            console.error("Помилка завантаження тегів:", err);
            return [];
        }
    };

    useEffect(() => {
        const fetchPostAndTags = async () => {
            const postInfo = await getInfoOfPost(id);
            if (postInfo) {
                setPost(postInfo);
            }

            if (postInfo.published == false) {
                    alert("У вас немає прав для доступу до цієї сторінки.");
                    window.location.href = "/posts";
                return;
            }

            const tagsInfo = await getTagsOfPost(id);
            setTags(tagsInfo);
        };
        fetchPostAndTags();
    }, [id]);

    // Видалення публікації
    const handleDeletePost = async (postId) => {
        if (!window.confirm("Ви впевнені, що хочете видалити цю публікацію?")) {
            return;
        }

        try {
            const res = await requestWithRefresh(
                `http://localhost:5000/api/post/delete/${postId}`, 
                {
                    method: "DELETE",
                }
            );
            if (res.ok) {
                alert("Публікацію успішно видалено.");
                navigate("/posts");
            } else {
                const errorData = await res.json();
                alert(`Не вдалося видалити публікацію: ${errorData.message}`);
            }
        } catch (err) {
            console.error("Критична помилка при видаленні:", err);
        }
    };

    // Коментарі
    useEffect(() => {
        const fetchComments = async () => {
            try {
                const res = await fetch(
                    `http://localhost:5000/api/comments/post/${id}`
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

    const handleAddComment = async () => {
        try {
            const res = await requestWithRefresh(
                `http://localhost:5000/api/comments`, 
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        parent_id: null,
                        author_id: currentUser.userId,
                        post_id: id,
                        text: newComment,
                    }),
                }
            );

            // Обробка відповіді
            if (res.ok) {
                const data = await res.json();
                setComments((prev) => [data.comment, ...prev]);
                setNewComment("");
            } else {
                const errorData = await res.json();
                console.error("Помилка сервера:", errorData.message);
                alert(`Не вдалося додати коментар: ${errorData.message}`);
            }
        } catch (err) {
            console.error("Критична помилка при відправці:", err);
        }
    };

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
                        .filter((c) => c.id !== targetId) 
                        .map((c) => ({
                            ...c,
                            replies: c.replies ? removeById(c.replies, targetId) : [],
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
                    }),
                }
            );

            if (res.ok) {
                const updateById = (list) => {
                    return list.map((c) => {
                        if (c.id === commentId) {
                            // Оновити текст локально
                            return { ...c, text: newText };
                        }
                        if (c.replies && c.replies.length > 0) {
                            return { ...c, replies: updateById(c.replies) };
                        }
                        return c;
                    });
                };

                setComments((prev) => updateById([...prev]));
            } else {
                const errorData = await res.json();
                alert(`Помилка: ${errorData.message}`);
            }
        } catch (err) {
            console.error("Помилка при оновленні:", err);
        }
    };

    const handleReplySubmit = async (parentId, replyText) => {
        if (!replyText.trim()) {
            return;
        }
        try {
            const res = await requestWithRefresh(
                `http://localhost:5000/api/comments`, 
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        parent_id: parentId,
                        author_id: currentUser.userId,
                        post_id: id,
                        text: replyText,
                    }),
                }
            );

            // Обробка відповіді
            if (res.ok) {
                const data = await res.json();
                const newReply = data.comment;

                // Функція для пошуку батька та вставки відповіді
                const insertReply = (list, pId, reply) => {
                    return list.map((c) => {
                        if (c.id === pId) {
                            return {
                                ...c,
                                replies: [reply, ...(c.replies || [])],
                            };
                        }
                        // Якщо у цього коментаря є свої відповіді, шукати в них (рекурсія)
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
                    // Якщо parent_id немає — це основний коментар, додати в корінь
                    if (!parentId) {
                        return [newReply, ...prev];
                    }
                    // Якщо є parent_id — шукати куди вставити
                    return insertReply(prev, parentId, newReply);
                });
            } else {
                const errorData = await res.json();
                console.error("Помилка сервера:", errorData.message);
                alert(`Не вдалося додати коментар: ${errorData.message}`);
            }
        } catch (err) {
            console.error("Критична помилка при відправці:", err);
        }
    };

    if (!post) {
        return (
            <div className="page-post">
                <div className="no-results">
                    <p>На жаль, такого поста не існує.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page-post">

            {/* Основна інформація про пост */}
            <div className="page-post__info">

                {/* Прев'ю поста — широкий банер */}
                <div className="page-post__info__preview">
                    <img
                        src={post?.preview}
                        loading="lazy"
                        alt={post?.title || "Прев'ю поста"}
                        className="page-post__info__post-preview"
                    />

                    <div className="page-post__info__preview-overlay">
                        <h1 className="page-post__info__post-title">
                            {post?.title}
                        </h1>

                        <p className="page-post__info__short-description">
                            {post?.short_description}
                        </p>
                    </div>
                </div>

                {/* Інформація про пост */}
                <div className="page-post__info__info">
                    <p className="page-post__info__post-info">
                        Автор:{" "}
                        <span className="page-post__info__author" onClick={() => navigate(`/profile/${post?.author?.id}`)}>
                            {post?.author?.nickname}
                        </span>
                    </p>

                    <p className="page-post__info__post-info">
                        Дата публікації:{" "}
                        {post?.created_at &&
                            new Date(post.created_at).toLocaleDateString("uk-UA")
                        }
                    </p>

                    {post?.updated_at &&
                        post.updated_at !== post.created_at && (
                            <p className="page-post__info__post-info">
                                Оновлено:{" "}
                                {new Date(post.updated_at).toLocaleDateString("uk-UA")}
                            </p>
                        )
                    }
                </div>
                <div className="page-post__info__tags">
                    {tags?.map((tag, index) => (
                        <button
                            key={tag.id || index}
                            className="page-post__info__tags_text"
                            onClick={() => navigate(`/posts?tags=${tag.id}`)}
                        >
                            {tag.tag}
                        </button>
                    ))}
                </div>
                {/* Адмінські кнопки */}
                {isAdmin && isOwner && (
                    <div className="page-post__actions">
                        <button
                            className="page-post__control-btn page-post__control-btn--edit"
                            onClick={() => navigate(`/upload/post/${post.id}`, { state: { mode: "edit" }})}
                            title="Редагувати">
                                <i className="fas fa-edit"></i>
                        </button>

                        <button
                            className="page-post__control-btn page-post__control-btn--delete"
                            onClick={() => handleDeletePost(post.id)}
                            title="Видалити">
                                <i className="fas fa-trash"></i>
                        </button>
                    </div>
                )}
            </div>

            {/* Контент статті */}
            <div className="page-post__content">
                <PostContent content={post?.content} />
            </div>

            {/* Коментарі */}
            <div className="page-post__comments">
                <h3 className="page-post__comments-title">
                    Коментарі
                </h3>
                {isLoggedIn ? (
                    <div className="page-post__comment-create">
                        <textarea
                            className="page-post__comment__input"
                            placeholder="Залишити коментар..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                        />
                        <button
                            className="page-post__comment__send-main"
                            onClick={handleAddComment}
                        >
                            Надіслати коментар
                        </button>
                    </div>
                ) : (
                    <p className="page-post__login-message">
                        Щоб залишити коментар,{" "}
                        <button
                            type="button"
                            className="page-post__login-link"
                            onClick={() => navigate("/login", { state: { mode: "login" } })}
                        >
                            увійдіть
                        </button>
                        {" "}або{" "}
                        <button
                            type="button"
                            className="page-post__login-link"
                            onClick={() => navigate("/login", { state: { mode: "register" } })}
                        >
                            зареєструйтеся
                        </button>
                        .
                    </p>
                )}

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

export default PostPage;