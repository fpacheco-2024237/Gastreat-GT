'use strict';

import Category from './category.model.js';
import { AppError } from '../../middlewares/handle-errors.js';
import { ensureRestaurantIsActive } from '../restaurants/restaurant.service.js';

export const buildActiveFilter = ({ includeInactive = false, isAdmin = false } = {}) => {
  if (includeInactive && isAdmin) return {};
  return { active: true };
};

export const getAll = async (filters = {}, options = {}) => {
  const query = {};
  if (filters.restaurantId) query.restaurantId = filters.restaurantId;
  if (filters.name) query.name = { $regex: filters.name, $options: 'i' };
  Object.assign(query, buildActiveFilter(options));
  return await Category.find(query).sort({ name: 1 });
};

export const getById = async (id) => {
  const category = await Category.findById(id);
  if (!category) throw new AppError('Categoría no encontrada', 404);
  return category;
};

export const ensureCategoryIsActive = async (categoryId) => {
  if (!categoryId) throw new AppError('categoryId faltante', 400);
  const category = await Category.findById(categoryId);
  if (!category) throw new AppError('Categoría no encontrada', 404);
  if (!category.active) throw new AppError('La categoría no está activa', 409, 'CATEGORY_INACTIVE');
  return category;
};

export const create = async (data) => {
  await ensureRestaurantIsActive(data.restaurantId);
  try {
    return await Category.create(data);
  } catch (err) {
    if (err.code === 11000) throw new AppError('Ya existe una categoría con ese nombre en este restaurante', 409, 'DUPLICATE');
    throw err;
  }
};

export const update = async (id, data) => {
  const category = await getById(id);
  if (!category.active) throw new AppError('No se puede modificar una categoría inactiva', 403);
  return await Category.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

export const softDelete = async (id, deletedBy) => {
  const category = await getById(id);
  category.active = false;
  category.deletedAt = new Date();
  category.deletedBy = deletedBy || null;
  return await category.save();
};

export const reactivate = async (id) => {
  const category = await getById(id);
  category.active = true;
  category.deletedAt = undefined;
  category.deletedBy = undefined;
  return await category.save();
};