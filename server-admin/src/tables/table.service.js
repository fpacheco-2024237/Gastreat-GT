'use strict';

import Table from './table.model.js';
import { AppError } from '../../middlewares/handle-errors.js';
import { ensureRestaurantIsActive } from '../restaurants/restaurant.service.js';

export const getAll = async (filters = {}) => {
  const query = {};
  if (filters.restaurantId) query.restaurantId = filters.restaurantId;
  if (filters.zone) query.zone = filters.zone;
  if (filters.status) query.status = filters.status;
  return await Table.find(query).sort({ tableNumber: 1 });
};

export const getById = async (id) => {
  const table = await Table.findById(id);
  if (!table) throw new AppError('Mesa no encontrada', 404);
  return table;
};

export const create = async (data) => {
  await ensureRestaurantIsActive(data.restaurantId);
  try {
    return await Table.create(data);
  } catch (err) {
    if (err.code === 11000) throw new AppError('Ya existe una mesa con ese número en este restaurante', 409, 'DUPLICATE');
    throw err;
  }
};

export const update = async (id, data) => {
  await getById(id);
  return await Table.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

export const changeStatus = async (id, status) => {
  await getById(id);
  return await Table.findByIdAndUpdate(id, { status }, { new: true, runValidators: true });
};

export const remove = async (id) => {
  const table = await getById(id);
  if (table.status === 'OCUPADA' || table.status === 'RESERVADA') {
    throw new AppError('No se puede eliminar una mesa ocupada o reservada', 409);
  }
  return await Table.findByIdAndDelete(id);
};