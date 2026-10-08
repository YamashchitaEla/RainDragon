import '../styles/pages/_start.css';
import { useNavigate } from "react-router-dom";

function StartPage() {
    const navigate = useNavigate();

    return (
        <div className="start-page">
            <div className="background"></div>
            <img id="logo-login" src={"/logo.PNG"}></img>
            <div className="buttons">
                <button className="button-start" 
                onClick={() => navigate("/login", { state: { mode: "login" } })}>Увійти</button>
                <button className="button-start"
                onClick={() => navigate("/login", { state: { mode: "register" } })}>Зареєструватися</button>
            </div>
        </div>
    );
}

export default StartPage;