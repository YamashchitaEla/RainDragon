import { useState } from "react";
import { requestWithRefresh } from "../api/requestWithRefresh";
import "../styles/pages/_contacts.css";

function ContactsPage() {
    const [form, setForm] = useState({
        name: "",
        email: "",
        subject: "",
        message: ""
    });

    const [sending, setSending] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm({
            ...form,
            [name]: value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSending(true);
        try {
            const res = await requestWithRefresh("http://localhost:5000/api/contacts", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(form)
                }
            );

            const data = await res.json();

            if (res.ok) {
                alert("Повідомлення успішно надіслано!");
                setForm({
                    name: "",
                    email: "",
                    subject: "",
                    message: ""
                });
            } else {
                alert(`Помилка: ${data.message}`);
            }
        } catch (err) {
            console.error("Помилка відправки повідомлення:", err);
            alert("Не вдалося надіслати повідомлення.");
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="contacts-page">
            <div className="contacts-container">
                <h1 className="contacts-title">
                    Зв'яжіться з нами
                </h1>
                <p className="contacts-description">
                    Маєте запитання, знайшли помилку або хочете
                    запропонувати щось для сайту? Напишіть нам.
                </p>
                <form className="contacts-form" onSubmit={handleSubmit}>
                    <div className="contacts-group">
                        <label className="contacts-label">
                            Ваше ім'я:
                        </label>

                        <input
                            className="contacts-input"
                            type="text"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            placeholder="Введіть ваше ім'я"
                            required
                        />
                    </div>

                    <div className="contacts-group">
                        <label className="contacts-label">
                            Email:
                        </label>

                        <input
                            className="contacts-input"
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="example@gmail.com"
                            required
                        />
                    </div>

                    <div className="contacts-group">
                        <label className="contacts-label">
                            Тема:
                        </label>

                        <input
                            className="contacts-input"
                            type="text"
                            name="subject"
                            value={form.subject}
                            onChange={handleChange}
                            placeholder="Тема повідомлення"
                            required
                        />
                    </div>

                    <div className="contacts-group">
                        <label className="contacts-label">
                            Повідомлення:
                        </label>

                        <textarea
                            className="contacts-textarea"
                            name="message"
                            value={form.message}
                            onChange={handleChange}
                            placeholder="Напишіть ваше повідомлення..."
                            required
                        />
                    </div>

                    <button type="submit" className="contacts-submit" disabled={sending}>
                        {sending ? "Надсилання..." : "Надіслати повідомлення"}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default ContactsPage;