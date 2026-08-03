'use strict';

import Restaurant from './restaurant.model.js';
import { AppError } from '../../../middlewares/handle-errors.js';

export const getAll = async (filters = {}, options = {}) => {
  const query = { active: true };
  if (filters.name) query.name = { $regex: filters.name, $options: 'i' };
  return await Restaurant.find(query).sort({ createdAt: -1 });
};

export const getById = async (id) => {
  return await Restaurant.findById(id);
};

export const ensureRestaurantIsActive = async (restaurantId) => {
  if (!restaurantId) throw new AppError('restaurantId faltante', 400);
  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) throw new AppError('Restaurante no encontrado', 404);
  if (!restaurant.active) throw new AppError('El restaurante no está activo', 409, 'RESTAURANT_INACTIVE');
  return true;
};