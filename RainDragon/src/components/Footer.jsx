import { Link } from "react-router-dom";
import '../styles/components/_footer.css';

export default function Footer() {
    return (
        <footer className="footer">
        <div className="footer-text__copyright">
            <p className="footer-text__copyright-element">©</p>
            <p className="footer-text__copyright-element-text">2027 Rain Dragon</p>
        </div>
        <p className="footer-text__description">Дипломна робота Ямащіти Рікаенжели 6.1213-2пі</p>
        <Link className="footer-text__contacts" to="/contacts">Контакти</Link>
        </footer>
    );
}