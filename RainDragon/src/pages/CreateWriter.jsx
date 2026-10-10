import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { requestWithRefresh } from "../api/requestWithRefresh";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../styles/pages/_create-writer.css";

function CreateWriter() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const { currentUser, isAdmin, authChecked } = useAuth();

    // Визначаємо режим на основі наявності ID або переданого стану
    const mode = location.state?.mode || (id ? "edit" : "create");

    const [writer, setWriter] = useState(null);
    
    // Завантаження автора при редагуванні
    useEffect(() => {
        if (!authChecked) {
            return;
        }

        if (!isAdmin){
            alert("У вас немає прав для доступу до цієї сторінки.");
            window.location.href = "/"; // Перенаправлення на головну сторінку
        }

        if (mode === "edit" && id) {
            const fetchWriterData = async () => {
                try {
                    const res = await requestWithRefresh(
                        `http://localhost:5000/api/writer/${id}`
                    );
                    if (res.ok) {
                        const data = await res.json();
                        setWriter(data.writerInfo || null);
                    }
                } catch (err) {
                    console.error("Помилка завантаження даних автора:", err);
                }
            };
            fetchWriterData();
        }
    }, [authChecked, isAdmin, id, mode]);

    // Обробник відправки форми
    const handleSubmit = async (e) => {
        e.preventDefault();

        const formData = new FormData();

        formData.append("full_name", writer?.full_name || "");
        formData.append("birthday", writer?.birthday || "");

        const url = mode === "edit"
            ? `http://localhost:5000/api/writer/update/${id}`
            : "http://localhost:5000/api/writer/create";

        const method = mode === "edit" ? "PUT" : "POST";

        try {
            const res = await requestWithRefresh(url, {
                method: method,
                body: formData
            });

            if (res.ok) {
                const data = await res.json();
                alert(mode === "edit" ? "Автора оновлено!" : "Автора створено!");
                navigate(`/writer/${id || data.writerId}`);
            } else {
                const error = await res.json();
                alert(`Помилка: ${error.message}`);
            }
        } catch (err) {
            console.error("Помилка відправки:", err);
        }
    };

    if (!authChecked) {
        return <div className="no-results">
                    <p>На жаль, за вашим запитом нічого не знайдено.</p>
                </div>;
    }

    return (
        <div className="create-writer">

            {/* Заголовок */}
            <h2 className="create-writer__title">
                {mode === "edit" ? "Редагувати автора" : "Додати нового автора"}
            </h2>

            <form className="create-writer__form" onSubmit={handleSubmit}>

                {/* Повне ім'я */}
                <div className="create-writer__group">
                    <label className="create-post__label">
                        Повне ім'я:
                    </label>

                    <input
                        type="text"
                        value={writer?.full_name || ""}
                        onChange={(e) => setWriter({...writer, full_name: e.target.value})}
                        placeholder="Наприклад: Мосян Тонсю"
                        required
                    />
                </div>

                {/* Дата народження */}
                <div className="create-writer__group">
                    <label className="create-post__label">
                        Дата народження:
                    </label>

                    <DatePicker
                        selected={
                            writer?.birthday
                                ? new Date(writer.birthday)
                                : null
                        }
                        onChange={(date) => {
                            setWriter({
                                ...writer,
                                birthday: date
                                    ? date.toISOString().split("T")[0]
                                    : ""
                            });
                        }}
                        dateFormat="dd.MM.yyyy"
                        placeholderText="Оберіть дату народження"
                        className="create-writer__date-picker"
                        calendarClassName="create-writer__calendar"
                        required
                    />
                </div>

                {/* Кнопка відправки */}
                <button type="submit" className="create-writer__submit-btn">
                    {mode === "edit" ? "Зберегти зміни" : "Створити автора"}
                </button>

            </form>
        </div>
    );
}

export default CreateWriter;