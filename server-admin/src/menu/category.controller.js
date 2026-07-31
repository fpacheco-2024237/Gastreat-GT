'use strict';

import * as categoryService from './category.service.js';

const isAdmin = (req) => req.user && req.user.role === 'ADMIN_ROLE';

export const getAll = async (req, res, next) => {
  try {
    const { restaurantId, name, includeInactive } = req.query;
    const options = { includeInactive: false, isAdmin: false };
    if ((includeInactive === 'true' || includeInactive === true) && isAdmin(req)) {
      options.includeInactive = true;
      options.isAdmin = true;
    }
    const items = await categoryService.getAll({ restaurantId, name }, options);
    res.status(200).json({ success: true, count: items.length, data: items });
  } catch (err) {
    next(err);
  }
};

export const getOne = async (req, res, next) => {
  try {
    const item = await categoryService.getById(req.params.id);
    if (!item.active && !isAdmin(req)) {
      return res.status(404).json({ success: false, message: 'Categoría no encontrada' });
    }
    res.status(200).json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    delete req.body.active;
    const item = await categoryService.create(req.body);
    res.status(201).json({ success: true, message: 'Categoría creada', data: item });
  } catch (err) {
    next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    delete req.body.active;
    delete req.body.restaurantId;
    const item = await categoryService.update(req.params.id, req.body);
    res.status(200).json({ success: true, message: 'Categoría actualizada', data: item });
  } catch (err) {
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    const deleted = await categoryService.softDelete(req.params.id, req.user?.id);
    res.status(200).json({ success: true, message: 'Categoría dada de baja', data: deleted });
  } catch (err) {
    next(err);
  }
};

export const reactivate = async (req, res, next) => {
  try {
    const item = await categoryService.reactivate(req.params.id);
    res.status(200).json({ success: true, message: 'Categoría reactivada', data: item });
  } catch (err) {
    next(err);
  }
};