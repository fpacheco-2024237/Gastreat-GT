'use strict';

import Restaurant from './restaurant.model.js';
import { AppError } from '../../middlewares/handle-errors.js';

/**
 * Construye un filtro que aplica la regla "activo por defecto".
 * - Si `includeInactive` es true y `isAdmin` es true, no filtra por status.
 * - En cualquier otro caso, fuerza `status: 'Activo'`.
 */
export const buildActiveFilter = ({ includeInactive = false, isAdmin = false } = {}) => {
  if (includeInactive && isAdmin) return {};
  return { active: true };
};

export const getAll = async (filters = {}, options = {}) => {
  const query = {};
  if (filters.name) query.name = { $regex: filters.name, $options: 'i' };
  // merge active filter
  const activeFilter = buildActiveFilter(options);
  Object.assign(query, activeFilter);
  return await Restaurant.find(query).sort({ createdAt: -1 });
};

export const validateSchedule = (openTime, closeTime) => {
  if (!openTime && !closeTime) return true;
  if ((openTime && !closeTime) || (!openTime && closeTime)) {
    throw new AppError('Se deben proveer ambos openTime y closeTime', 400);
  }
  const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(openTime) || !timeRegex.test(closeTime)) {
    throw new AppError('Formato de horario inválido (HH:mm)', 400);
  }
  return true;
};

export const calculateIsOpenNow = (openTime, closeTime) => {
  if (!openTime || !closeTime) return null;
  const now = new Date();
  // Adjust to Guatemala time (UTC-6) for local time check, or just use server time (assuming server time is local)
  // For simplicity, using simple HH:mm comparison
  const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
  if (openTime <= closeTime) {
    return currentTime >= openTime && currentTime <= closeTime;
  } else {
    // crosses midnight
    return currentTime >= openTime || currentTime <= closeTime;
  }
};

export const getById = async (id) => {
  const restaurant = await Restaurant.findById(id);
  if (!restaurant) throw new AppError('Restaurante no encontrado', 404);
  return restaurant;
};

/**
 * Valida que un `restaurantId` corresponda a un restaurante activo.
 * Lanzará AppError(409) si no está activo o no existe.
 * Usar desde otros servicios antes de crear/actualizar datos relacionados.
 */
export const ensureRestaurantIsActive = async (restaurantId) => {
  if (!restaurantId) throw new AppError('restaurantId faltante', 400);
  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) throw new AppError('Restaurante no encontrado', 404);
  if (!restaurant.active) throw new AppError('El restaurante no está activo', 409, 'RESTAURANT_INACTIVE');
  return true;
};

export const create = async (data) => {
  try {
    const doc = await Restaurant.create(data);
    return doc;
  } catch (err) {
    if (err.code === 11000) {
      throw new AppError('Registro duplicado', 409, 'DUPLICATE');
    }
    throw err;
  }
};

export const update = async (id, data) => {
  const restaurant = await Restaurant.findById(id);
  if (!restaurant) throw new AppError('Restaurante no encontrado', 404);

  return await Restaurant.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

export const softDelete = async (id, deletedBy) => {
  const restaurant = await Restaurant.findById(id);
  if (!restaurant) throw new AppError('Restaurante no encontrado', 404);

  restaurant.active = false;
  restaurant.deletedAt = new Date();
  restaurant.deletedBy = deletedBy || null;

  return await restaurant.save();
};

export const reactivate = async (id) => {
  const restaurant = await Restaurant.findById(id);
  if (!restaurant) throw new AppError('Restaurante no encontrado', 404);

  restaurant.active = true;
  restaurant.deletedAt = undefined;
  restaurant.deletedBy = undefined;

  return await restaurant.save();
};
