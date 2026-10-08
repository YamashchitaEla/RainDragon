import { useState } from "react";
import { jwtDecode } from "jwt-decode"; // Імпортуємо бібліотеку
import { useNavigate } from "react-router-dom";
import "../styles/components/_comment.css";

function Comment({ comment, onReplySubmit, onDelete, onUpdate }) {
    const navigate = useNavigate();
    
    // Отримуємо дані користувача з токена
    const token = localStorage.getItem("token");
    let currentUser = null;

    if (token) {
        try {
            currentUser = jwtDecode(token);
        } catch (error) {
            console.error("Invalid token");
        }
    }

    // Перевірка, чи є користувач власником коментаря
    const isOwner = currentUser && String(currentUser.userId) === String(comment.author_id);

    // Стан для редагування
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(comment.text);;
    const canEdit = isOwner;
    const handleUpdate = () => {
        if (editText.trim() && editText !== comment.text) {
            onUpdate(comment.id, editText);
        }
        setIsEditing(false);
    };

    const canDelete = currentUser && (
        currentUser.userId === comment.author_id ||
        currentUser.admin === true
    );
    const handleDelete = () => {
        if (window.confirm("Ви впевнені, що хочете видалити цей коментар?")) {
            onDelete(comment.id);
        }
    }
    
    // Стан для відповіді
    const [isReplying, setIsReplying] = useState(false);
    const [replyText, setReplyText] = useState("");
    const handleReply = () => {
        if (replyText.trim()) {
            onReplySubmit(comment.id, replyText);
            setReplyText("");
            setIsReplying(false);
        }
    };

    // Функція для скасування відповіді
    const handleCancel = () => {
        setReplyText("");
        setIsReplying(false);
    }

    return (
        <div className="comment-container">
            <div className="comment">
                <div className="comment__side">
                    <img src={comment.avatar || "/default-avatar.png"} alt={comment.nickname} className="comment__avatar" onClick={() => navigate(`/profile/${comment.author_id}`)} />
                </div>
                <div className="comment__content">
                    <div className="comment__header">
                        <span className="comment__nickname">{comment.nickname}</span>
                        <div className="comment__meta">
                            {canEdit && (
                                <button
                                    className="comment__edit-btn"
                                    onClick={() => setIsEditing(!isEditing)}>
                                    <i className="fa-solid fa-pen"></i>
                                </button>
                            )}
                            {canDelete && (
                                <button
                                    className="comment__delete-btn"
                                    onClick={handleDelete}
                                    title="Видалити коментар">
                                    <i className="fa-solid fa-trash"></i>
                                </button>
                            )}
                        </div>
                        <span className="comment__date">{new Date(comment.date).toLocaleString('uk-UA', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}</span>
                    </div>

                    {isEditing ? (
                        <div className="comment__edit-wrapper">
                            <textarea
                                className="comment__input"
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                            />
                            <div className="comment__input-actions">
                                <button className="btn-send" onClick={handleUpdate}>Зберегти</button>
                                <button className="btn-cancel" onClick={() => setIsEditing(false)}>Скасувати</button>
                            </div>
                        </div>
                    ) : (
                        <p className="comment__text">{comment.text}</p>
                    )}

                    <button className="comment__reply-btn" onClick={() => setIsReplying(!isReplying)}>
                        <i className="fa-solid fa-reply"></i> Відповісти
                    </button>

                    {isReplying && (
                        <div className="comment__reply-input-wrapper">
                            <textarea
                                className="comment__input"
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                            />
                            <div className="comment__input-actions">
                                <button className="btn-send" onClick={handleReply}>Відправити</button>
                                <button className="btn-cancel" onClick={handleCancel}>Скасувати</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {comment.replies && comment.replies.length > 0 && (
                <div className="comment__replies">
                    {comment.replies.map(r => (
                        <Comment key={r.id} comment={r} onReplySubmit={onReplySubmit} onDelete={onDelete} onUpdate={onUpdate} />
                    ))}
                </div>
            )}
        </div>
    );
}

export default Comment; 