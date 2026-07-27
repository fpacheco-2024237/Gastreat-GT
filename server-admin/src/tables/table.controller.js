'use strict';

import * as tableService from './table.service.js';

export const getAll = async (req, res, next) => {
  try {
    const { restaurantId, zone, status } = req.query;
    const items = await tableService.getAll({ restaurantId, zone, status });
    res.status(200).json({ success: true, count: items.length, data: items });
  } catch (err) {
    next(err);
  }
};

export const getOne = async (req, res, next) => {
  try {
    const item = await tableService.getById(req.params.id);
    res.status(200).json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    const item = await tableService.create(req.body);
    res.status(201).json({ success: true, message: 'Mesa creada', data: item });
  } catch (err) {
    next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    const item = await tableService.update(req.params.id, req.body);
    res.status(200).json({ success: true, message: 'Mesa actualizada', data: item });
  } catch (err) {
    next(err);
  }
};

export const changeStatus = async (req, res, next) => {
  try {
    const item = await tableService.changeStatus(req.params.id, req.body.status);
    res.status(200).json({ success: true, message: 'Estado de mesa actualizado', data: item });
  } catch (err) {
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    await tableService.remove(req.params.id);
    res.status(200).json({ success: true, message: 'Mesa eliminada' });
  } catch (err) {
    next(err);
  }
};