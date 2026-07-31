'use strict';

import * as orderService from './order.service.js';

export const create = async (req, res, next) => {
  try {
    const item = await orderService.create(req.body, req.user.id);
    res.status(201).json({ success: true, message: 'Pedido creado', data: item });
  } catch (err) {
    next(err);
  }
};

export const getMyOrders = async (req, res, next) => {
  try {
    const items = await orderService.getByUser(req.user.id);
    res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
};