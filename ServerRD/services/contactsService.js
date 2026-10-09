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
        // Самі собі надсилаються, бо інакше означало би, що Gmail-сервер намагається відправити лист від імені чужої пошти. Gmail та інші поштові системи блокують таке та помічають
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