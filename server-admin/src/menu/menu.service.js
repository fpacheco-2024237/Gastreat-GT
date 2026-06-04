'use strict';

import MenuItem from './menu.model.js';
import { AppError } from '../../middlewares/handle-errors.js';
import { cloudinary } from '../../middlewares/upload.middleware.js';

export const getAllItems = async (filters = {}) => {
    const query = {};
    if (filters.category) query.category = filters.category;
    if (filters.status) query.status = filters.status;
    return await MenuItem.find(query).sort({ createdAt: -1 });
};

export const getItemById = async (id) => {
    const item = await MenuItem.findById(id);
    if (!item) throw new AppError('Platillo no encontrado', 404);
    return item;
};

export const createItem = async (data, file) => {
    let image = null;
    let imagePublicId = null;

    if (file) {
        image = file.path;         // URL de Cloudinary
        imagePublicId = file.filename; // public_id de Cloudinary
    }

    return await MenuItem.create({ ...data, image, imagePublicId });
};

export const updateItem = async (id, data, file) => {
    const item = await MenuItem.findById(id);
    if (!item) throw new AppError('Platillo no encontrado', 404);

    if (file) {
        // Eliminar imagen anterior de Cloudinary si existe
        if (item.imagePublicId) {
            await cloudinary.uploader.destroy(item.imagePublicId);
        }
        data.image = file.path;
        data.imagePublicId = file.filename;
    }

    return await MenuItem.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true,
    });
};

export const changeStatus = async (id, status) => {
    const item = await MenuItem.findById(id);
    if (!item) throw new AppError('Platillo no encontrado', 404);
    item.status = status;
    return await item.save();
};

export const deleteItem = async (id) => {
    const item = await MenuItem.findById(id);
    if (!item) throw new AppError('Platillo no encontrado', 404);

    if (item.imagePublicId) {
        await cloudinary.uploader.destroy(item.imagePublicId);
    }

    await item.deleteOne();
};
