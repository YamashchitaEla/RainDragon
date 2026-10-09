import { findUserByIdService, updateProfileService } from "../services/userService.js";

export const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await findUserByIdService(id);

        return res.status(200).json({ 
            success: true, 
            user 
        });
    } catch (err) {
        console.error("Get User By ID Error:", err);
        
        // Динамічний статус-код з сервісу (наприклад, 404), інакше 500
        const statusCode = err.statusCode || 500;
        return res.status(statusCode).json({ 
            success: false, 
            message: err.message || "Внутрішня помилка сервера" 
        });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const { id } = req.params;
        const { nickname, about } = req.body;
        const file = req.file; 

        const updatedUser = await updateProfileService(id, { nickname, about }, file);

        return res.status(200).json({
            success: true,
            user: updatedUser
        });
    } catch (err) {
        console.error("Update Profile Error:", err);
        
        const statusCode = err.statusCode || 500;
        return res.status(statusCode).json({ 
            success: false, 
            message: err.message || "Внутрішня помилка сервера" 
        });
    }
};