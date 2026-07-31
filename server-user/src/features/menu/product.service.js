'use strict';

import Product from './product.model.js';
import { AppError } from '../../../middlewares/handle-errors.js';

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