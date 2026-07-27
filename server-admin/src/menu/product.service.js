'use strict';

import Product from './product.model.js';
import { AppError } from '../../middlewares/handle-errors.js';
import { ensureRestaurantIsActive } from '../restaurants/restaurant.service.js';
import { ensureCategoryIsActive } from './category.service.js';

export const buildActiveFilter = ({ includeInactive = false, isAdmin = false } = {}) => {
  if (includeInactive && isAdmin) return {};
  return { active: true };
};

export const getAll = async (filters = {}, options = {}) => {
  const query = {};
  if (filters.restaurantId) query.restaurantId = filters.restaurantId;
  if (filters.categoryId) query.categoryId = filters.categoryId;
  if (filters.name) query.name = { $regex: filters.name, $options: 'i' };
  Object.assign(query, buildActiveFilter(options));
  return await Product.find(query).sort({ name: 1 });
};

export const getById = async (id) => {
  const product = await Product.findById(id);
  if (!product) throw new AppError('Platillo no encontrado', 404);
  return product;
};

/** Usado por Comandas para validar disponibilidad antes de crear un pedido. */
export const ensureProductIsAvailable = async (productId, quantity) => {
  const product = await Product.findById(productId);
  if (!product) throw new AppError(`Platillo no encontrado: ${productId}`, 404);
  if (!product.active) throw new AppError(`Platillo inactivo: ${product.name}`, 409, 'PRODUCT_INACTIVE');
  if (product.stock < quantity) {
    throw new AppError(`Stock insuficiente para ${product.name} (disponible: ${product.stock})`, 409, 'INSUFFICIENT_STOCK');
  }
  return product;
};

/**
 * Descuenta stock de varios productos de forma atómica por documento.
 * Si uno falla a mitad de camino, revierte los que sí se aplicaron.
 * No usa transacciones de Mongo (requieren replica set); es el patrón
 * correcto para el alcance actual.
 */
export const deductStockForItems = async (items) => {
  const applied = [];
  try {
    for (const item of items) {
      const updated = await Product.findOneAndUpdate(
        { _id: item.productId, active: true, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { new: true }
      );
      if (!updated) {
        throw new AppError(`Stock insuficiente o platillo inactivo (${item.productId})`, 409, 'INSUFFICIENT_STOCK');
      }
      applied.push(item);
    }
  } catch (err) {
    for (const a of applied) {
      await Product.findByIdAndUpdate(a.productId, { $inc: { stock: a.quantity } });
    }
    throw err;
  }
};

export const restoreStockForItems = async (items) => {
  for (const item of items) {
    await Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.quantity } });
  }
};

export const create = async (data) => {
  await ensureRestaurantIsActive(data.restaurantId);
  await ensureCategoryIsActive(data.categoryId);
  return await Product.create(data);
};

export const update = async (id, data) => {
  const product = await getById(id);
  if (!product.active) throw new AppError('No se puede modificar un platillo inactivo', 403);
  if (data.categoryId) await ensureCategoryIsActive(data.categoryId);
  return await Product.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

export const softDelete = async (id, deletedBy) => {
  const product = await getById(id);
  product.active = false;
  product.deletedAt = new Date();
  product.deletedBy = deletedBy || null;
  return await product.save();
};

export const reactivate = async (id) => {
  const product = await getById(id);
  product.active = true;
  product.deletedAt = undefined;
  product.deletedBy = undefined;
  return await product.save();
};