import * as contactService from "../services/contactsService.js";

export const sendMail = async (req, res) => {

    try {
        const { name, email, subject, message } = req.body;

        await contactService.sendContactMessage(name, email, subject, message);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};