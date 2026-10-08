import nodemailer from "nodemailer";
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

export const sendContactMessage = async (name, email, subject, message ) => {
    if (!name || !email || !subject || !message) {
        throw new Error("Не всі поля заповнені");
    }

    await transporter.sendMail({
        // Самі собі, боо інакше означало би, що Gmail-сервер намагається відправити лист нібито від імені чужої пошти. Gmail та інші поштові системи можуть таке блокувати або помічати як підозріле.
        // Лист приходить ніби-то від нас, але відповідь вже конкретно користувачу
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER,
        replyTo: email,

        subject: `[Rain Dragon] ${subject}`,

        text: `
            Ім'я: ${name}
            Email: ${email}

            Повідомлення:

            ${message}
        `
    });
};