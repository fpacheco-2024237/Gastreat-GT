'use strict';

import Order, { ORDER_STATUSES } from './order.model.js';
import { AppError } from '../../middlewares/handle-errors.js';
import { restoreStockForItems } from '../menu/product.service.js';

const NEXT_STATUS = {
  PENDIENTE: ['EN_PREPARACION', 'CANCELADO'],
  EN_PREPARACION: ['LISTO', 'CANCELADO'],
  LISTO: ['ENTREGADO'],
  ENTREGADO: [],
  CANCELADO: [],
};

export const getAll = async (filters = {}) => {
  const query = {};
  if (filters.restaurantId) query.restaurantId = filters.restaurantId;
  if (filters.status) query.status = filters.status;
  if (filters.tableId) query.tableId = filters.tableId;
  return await Order.find(query).sort({ createdAt: -1 });
};

export const getById = async (id) => {
  const order = await Order.findById(id);
  if (!order) throw new AppError('Pedido no encontrado', 404);
  return order;
};

export const updateStatus = async (id, newStatus) => {
  const order = await getById(id);
  const allowed = NEXT_STATUS[order.status] || [];
  if (!allowed.includes(newStatus)) {
    throw new AppError(`No se puede pasar de ${order.status} a ${newStatus}`, 409, 'INVALID_TRANSITION');
  }
  order.status = newStatus;
  return await order.save();
};

export const cancel = async (id) => {
  const order = await getById(id);
  if (!['PENDIENTE', 'EN_PREPARACION'].includes(order.status)) {
    throw new AppError(`No se puede cancelar un pedido en estado ${order.status}`, 409);
  }
  order.status = 'CANCELADO';
  await order.save();
  await restoreStockForItems(order.items.map((i) => ({ productId: i.productId, quantity: i.quantity })));
  return order;
};

export { ORDER_STATUSES };