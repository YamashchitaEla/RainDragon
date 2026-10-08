import "../styles/cards/_draft-card.css";
import { useNavigate } from "react-router-dom";

function DraftCard({ preview, title, short_description, id }) {
    const navigate = useNavigate();
    return (
        <div className="draft-card" onClick={() => navigate(`/upload/post/${id}`, { state: { mode: "edit" }})}>
            <div className="draft-card__preview">
                <img src={preview} alt={title} className="post-card__preview-image" loading="lazy"/>
                <div className="draft-card__badge">
                    Чернетка
                </div>
                <div className="post-card__overlay">
                    <h3 className="post-card__title">
                        {title}
                    </h3>

                    <p className="post-card__description">
                        {short_description}
                    </p>

                    <span className="draft-card__edit">
                        Продовжити редагування →
                    </span>
                </div>
            </div>
        </div>
    );
}

export default DraftCard;