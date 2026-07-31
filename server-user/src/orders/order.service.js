'use strict';

import Order from './order.model.js';
import { AppError } from '../../middlewares/handle-errors.js';
import { ensureRestaurantIsActive } from '../restaurants/restaurant.service.js';
import { ensureProductIsAvailable, deductStockForItems, restoreStockForItems } from '../menu/product.service.js';

export const create = async (data, waiterId) => {
  await ensureRestaurantIsActive(data.restaurantId);

  if (!Array.isArray(data.items) || data.items.length === 0) {
    throw new AppError('El pedido debe tener al menos un platillo', 400);
  }

  const items = [];
  for (const raw of data.items) {
    const product = await ensureProductIsAvailable(raw.productId, raw.quantity);
    items.push({
      productId: product._id,
      name: product.name,
      unitPrice: product.price,
      quantity: raw.quantity,
      subtotal: product.price * raw.quantity,
    });
  }

  await deductStockForItems(items.map((i) => ({ productId: i.productId, quantity: i.quantity })));

  const total = items.reduce((sum, i) => sum + i.subtotal, 0);

  try {
    return await Order.create({
      restaurantId: data.restaurantId,
      tableId: data.tableId || null,
      waiterId,
      items,
      notes: data.notes,
      total,
    });
  } catch (err) {
    await restoreStockForItems(items.map((i) => ({ productId: i.productId, quantity: i.quantity })));
    throw err;
  }
};