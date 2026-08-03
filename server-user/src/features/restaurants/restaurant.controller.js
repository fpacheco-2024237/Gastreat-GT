'use strict';

import * as restaurantService from './restaurant.service.js';

export const getAll = async (req, res, next) => {
  try {
    const { name } = req.query;
    const items = await restaurantService.getAll({ name }, { includeInactive: false, isAdmin: false });
    res.status(200).json({ success: true, count: items.length, data: items });
  } catch (err) {
    next(err);
  }
};

export const getOne = async (req, res, next) => {
  try {
    const item = await restaurantService.getById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Restaurante no encontrado' });
    }
    if (!item.active) {
      return res.status(404).json({ success: false, message: 'Restaurante no encontrado' });
    }
    const itemData = item.toJSON();
    itemData.isOpenNow = restaurantService.calculateIsOpenNow(item.openTime, item.closeTime);
    res.status(200).json({ success: true, data: itemData });
  } catch (err) {
    next(err);
  }
};