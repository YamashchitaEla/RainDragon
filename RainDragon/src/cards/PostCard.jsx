import "../styles/cards/_post-card.css";
import { useNavigate } from "react-router-dom";

function PostCard({ preview, title, short_description, id }) {
    const navigate = useNavigate();
    return (
        <div className="post-card" onClick={() => navigate(`/post/${id}`)}>
            <div className="post-card__preview">
                <img src={preview} alt={title} className="post-card__preview-image" loading="lazy"/>
                <div className="post-card__overlay">
                    <h3 className="post-card__title">
                        {title}
                    </h3>

                    <p className="post-card__description">
                        {short_description}
                    </p>
                </div>
            </div>
        </div>
    );
}

export default PostCard;
