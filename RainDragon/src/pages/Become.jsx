import '../styles/pages/_become.css';
import { useNavigate } from "react-router-dom";

function BecomePage() {
    const navigate = useNavigate();

    return (
        <div className="become-page">
            <div className="background"></div>
            <img id="logo-login" src={"/logo.PNG"}></img>
            <div className="buttons">
                <button className="button-become" 
                onClick={() => navigate("/login", { state: { mode: "login" } })}>Увійти</button>
                <button className="button-become"
                onClick={() => navigate("/login", { state: { mode: "register" } })}>Зареєструватися</button>
            </div>
        </div>
    );
}

export default BecomePage;