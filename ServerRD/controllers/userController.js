import { findUserByIdService, updateProfileService } from "../services/userService.js";
import { handleControllerError } from '../utils/errorHandler.js';

export const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await findUserByIdService(id);
        
        return res.status(200).json({ 
            success: true, 
            user 
        });
    } catch (err) {
        return handleControllerError(res, err, "Get User Error");
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
        return handleControllerError(res, err, "Update User Error");
    }
};