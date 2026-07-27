'use strict';

import Invoice from './invoice.model.js';
import { AppError } from '../../middlewares/handle-errors.js';
import { getById as getOrderById } from '../orders/order.service.js';

// Ajusta esta constante si la tasa cambia o si en algún momento la haces configurable.
const TAX_RATE = 0.12; // IVA Guatemala 12%

export const getAll = async (filters = {}) => {
  const query = {};
  if (filters.restaurantId) query.restaurantId = filters.restaurantId;
  if (filters.status) query.status = filters.status;
  return await Invoice.find(query).sort({ createdAt: -1 });
};

export const getById = async (id) => {
  const invoice = await Invoice.findById(id);
  if (!invoice) throw new AppError('Factura no encontrada', 404);
  return invoice;
};

export const create = async (orderId, issuedBy) => {
  const order = await getOrderById(orderId);

  if (order.status !== 'ENTREGADO') {
    throw new AppError('Solo se puede facturar un pedido en estado ENTREGADO', 409);
  }

  const existing = await Invoice.findOne({ orderId });
  if (existing) throw new AppError('Este pedido ya tiene una factura', 409, 'DUPLICATE');

  const subtotal = order.total;
  const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;

  return await Invoice.create({
    orderId: order._id,
    restaurantId: order.restaurantId,
    subtotal,
    tax,
    total,
    issuedBy,
  });
};

export const markAsPaid = async (id, paymentMethod) => {
  const invoice = await getById(id);
  if (invoice.status !== 'PENDIENTE') {
    throw new AppError(`No se puede pagar una factura en estado ${invoice.status}`, 409);
  }
  invoice.status = 'PAGADA';
  invoice.paymentMethod = paymentMethod;
  return await invoice.save();
};

export const voidInvoice = async (id, reason) => {
  const invoice = await getById(id);
  if (invoice.status === 'ANULADA') {
    throw new AppError('Esta factura ya está anulada', 409);
  }
  invoice.status = 'ANULADA';
  invoice.voidReason = reason || null;
  return await invoice.save();
};