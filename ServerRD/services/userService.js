import { User } from "../models/User.js"
import { NotFoundError, BadRequestError, AppError } from "../utils/customErrors.js";
import { deleteFileFromCloudinary } from "../utils/cloudinaryHelper.js";
import "dotenv/config";

export const findUserByIdService = async (id) => {
    if (!id) {
        throw new BadRequestError("ID користувача не визначено");
    }

    const user = await User.findById(id);
    if (!user) {
        throw new NotFoundError(`Користувач з ID ${id} не знайдений`);
    }

    return user;
};

export const updateProfileService = async (userId, { nickname, about }, file) => {
    if (!userId){
        throw new BadRequestError("ID користувача не визначено");
    }

    const currentUser = await User.findById(userId);
    if (!currentUser) {
        throw new NotFoundError(`Користувач з ID ${userId} не знайдений`);
    }

    let avatarPath = undefined;

    // Формування об'єкту для оновлення
    // Якщо файл є - беремо шлях з Cloudinary, якщо ні - undefined (COALESCE в моделі спрацює)
    if (file) {
        avatarPath = file.path;
        try {
            await deleteFileFromCloudinary(currentUser.avatar);
        } catch (err) {
            console.error("Не вдалося видалити старий аватар з Cloudinary:", err);
        }
        
    }

    const updatedUser = await User.update(
        userId, 
        { nickname, about, avatar: avatarPath }
    );

    if (!updatedUser) {
        throw new AppError("Не вдалося оновити профіль", 500);
    }

    return updatedUser;
};