'use strict';

import * as reservationService from './reservation.service.js';

export const create = async (req, res, next) => {
  try {
    const item = await reservationService.create(req.body, req.user.id);
    res.status(201).json({ success: true, message: 'Reserva creada', data: item });
  } catch (err) {
    next(err);
  }
};

export const getMyReservations = async (req, res, next) => {
  try {
    const items = await reservationService.getByUser(req.user.id);
    res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
};

export const cancel = async (req, res, next) => {
  try {
    const item = await reservationService.cancel(req.params.id, req.user.id);
    res.json({ success: true, message: 'Reserva cancelada', data: item });
  } catch (err) {
    next(err);
  }
};