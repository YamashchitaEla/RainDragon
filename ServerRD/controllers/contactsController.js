import * as contactService from "../services/contactsService.js";
import { handleControllerError } from '../utils/errorHandler.js';

export const sendMail = async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        await contactService.sendContactMessage(name, email, subject, message);
        
        return res.status(200).json({ 
            success: true, 
            true 
        });
    } catch (err) {
        return handleControllerError(res, err, "Send Mail Error");
    }
};