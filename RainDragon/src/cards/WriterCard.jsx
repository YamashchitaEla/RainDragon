import "../styles/cards/_writer-card.css";
import { useNavigate } from "react-router-dom";

function WriterCard({ full_name, birthday, id }) {
    const navigate = useNavigate();

    return (
        <div className="writer-card" onClick={() => navigate(`/writer/${id}`)}>
            <h3 className="writer-full_name">{full_name}</h3>
            <p><strong><i className="fas fa-birthday-cake"></i> Дата народження:</strong> {birthday}</p>
        </div>
    )
}

export default WriterCard;