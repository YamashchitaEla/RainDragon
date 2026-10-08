import "../styles/cards/_book-card.css";
import { useNavigate } from "react-router-dom";

function BookCard({ preview, ukrainian_name, author, id }) {
    const navigate = useNavigate();
    return (
        <div className="book-card" onClick={() => navigate(`/book/${id}`)}>
            <img src={preview} alt={ukrainian_name} className="book-preview" loading="lazy" />
            <h3 className="book-title">{ukrainian_name}</h3>
            <p className="book-author">{author}</p>
        </div>
    )
}

export default BookCard;