'use strict';

import Table from './table.model.js';
import { AppError } from '../../middlewares/handle-errors.js';

export const getAllTables = async (filters = {}) => {
    const query = {};
    if (filters.status) query.status = filters.status;
    return await Table.find(query).sort({ number: 1 });
};

export const getTableById = async (id) => {
    const table = await Table.findById(id);
    if (!table) throw new AppError('Mesa no encontrada', 404);
    return table;
};

export const createTable = async (data) => {
    const exists = await Table.findOne({ number: data.number });
    if (exists) throw new AppError(`La mesa número ${data.number} ya existe`, 409);
    return await Table.create(data);
};

export const updateTable = async (id, data) => {
    const table = await Table.findById(id);
    if (!table) throw new AppError('Mesa no encontrada', 404);

    // Si cambia el número, verificar que no exista otro con ese número
    if (data.number && data.number !== table.number) {
        const exists = await Table.findOne({ number: data.number });
        if (exists) throw new AppError(`La mesa número ${data.number} ya existe`, 409);
    }

    return await Table.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

export const changeStatus = async (id, status) => {
    const table = await Table.findById(id);
    if (!table) throw new AppError('Mesa no encontrada', 404);
    table.status = status;
    return await table.save();
};

export const deleteTable = async (id) => {
    const table = await Table.findById(id);
    if (!table) throw new AppError('Mesa no encontrada', 404);
    if (table.status === 'Ocupada') {
        throw new AppError('No se puede eliminar una mesa ocupada', 400);
    }
    await table.deleteOne();
};
