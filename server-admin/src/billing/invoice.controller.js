'use strict';

import * as invoiceService from './invoice.service.js';

export const getAll = async (req, res, next) => {
  try {
    const { restaurantId, status } = req.query;
    const items = await invoiceService.getAll({ restaurantId, status });
    res.status(200).json({ success: true, count: items.length, data: items });
  } catch (err) {
    next(err);
  }
};

export const getOne = async (req, res, next) => {
  try {
    const item = await invoiceService.getById(req.params.id);
    res.status(200).json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    const item = await invoiceService.create(req.body.orderId, req.user.id);
    res.status(201).json({ success: true, message: 'Factura generada', data: item });
  } catch (err) {
    next(err);
  }
};

export const markAsPaid = async (req, res, next) => {
  try {
    const item = await invoiceService.markAsPaid(req.params.id, req.body.paymentMethod);
    res.status(200).json({ success: true, message: 'Factura pagada', data: item });
  } catch (err) {
    next(err);
  }
};

export const voidInvoice = async (req, res, next) => {
  try {
    const item = await invoiceService.voidInvoice(req.params.id, req.body.reason);
    res.status(200).json({ success: true, message: 'Factura anulada', data: item });
  } catch (err) {
    next(err);
  }
};