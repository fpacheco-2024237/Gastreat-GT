'use strict';

import * as orderService from './order.service.js';

export const getAll = async (req, res, next) => {
  try {
    const { restaurantId, status, tableId } = req.query;
    const items = await orderService.getAll({ restaurantId, status, tableId });
    res.status(200).json({ success: true, count: items.length, data: items });
  } catch (err) {
    next(err);
  }
};

export const getOne = async (req, res, next) => {
  try {
    const item = await orderService.getById(req.params.id);
    res.status(200).json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
};

export const updateStatus = async (req, res, next) => {
  try {
    const item = await orderService.updateStatus(req.params.id, req.body.status);
    res.status(200).json({ success: true, message: 'Estado del pedido actualizado', data: item });
  } catch (err) {
    next(err);
  }
};

export const cancel = async (req, res, next) => {
  try {
    const item = await orderService.cancel(req.params.id);
    res.status(200).json({ success: true, message: 'Pedido cancelado', data: item });
  } catch (err) {
    next(err);
  }
};