'use strict';

import * as restaurantService from './restaurant.service.js';

const isAdmin = (req) => req.user && req.user.role === 'ADMIN_ROLE';

export const getAll = async (req, res, next) => {
  try {
    const { name, includeInactive } = req.query;
    const includeInactiveFlag = includeInactive === 'true' || includeInactive === true;

    const options = { includeInactive: false, isAdmin: false };
    if (includeInactiveFlag && isAdmin(req)) {
      options.includeInactive = true;
      options.isAdmin = true;
    }

    const items = await restaurantService.getAll({ name }, options);
    res.status(200).json({ success: true, count: items.length, data: items });
  } catch (err) {
    next(err);
  }
};

export const getOne = async (req, res, next) => {
  try {
    const item = await restaurantService.getById(req.params.id);

    // If restaurant is inactive and requester is not admin, hide as 404
    if (!item.active) {
      if (!isAdmin(req)) {
        return res.status(404).json({ success: false, message: 'Restaurante no encontrado' });
      }
    }

    const itemData = item.toJSON();
    itemData.isOpenNow = restaurantService.calculateIsOpenNow(item.openTime, item.closeTime);

    res.status(200).json({ success: true, data: itemData });
  } catch (err) {
    next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    delete req.body.active;
    req.body.administrators = req.user && req.user.id ? [req.user.id] : [];
    
    restaurantService.validateSchedule(req.body.openTime, req.body.closeTime);

    const item = await restaurantService.create(req.body);
    res.status(201).json({ success: true, message: 'Restaurante creado', data: item });
  } catch (err) {
    next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    delete req.body.active;
    delete req.body.administrators;
    
    restaurantService.validateSchedule(req.body.openTime, req.body.closeTime);

    // Prevent modifications to logically deleted restaurants unless it's a reactivation
    // Wait, update itself shouldn't reactivate, we have a separate reactivate route
    const current = await restaurantService.getById(req.params.id);
    if (!current.active) {
      return res.status(403).json({ success: false, message: 'No se puede modificar un restaurante inactivo' });
    }

    const item = await restaurantService.update(req.params.id, req.body);
    res.status(200).json({ success: true, message: 'Restaurante actualizado', data: item });
  } catch (err) {
    next(err);
  }
};

export const reactivate = async (req, res, next) => {
  try {
    const item = await restaurantService.reactivate(req.params.id);
    res.status(200).json({ success: true, message: 'Restaurante reactivado', data: item });
  } catch (err) {
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    const deleted = await restaurantService.softDelete(req.params.id, req.user?.id);
    res.status(200).json({ success: true, message: 'Restaurante dado de baja', data: deleted });
  } catch (err) {
    next(err);
  }
};
