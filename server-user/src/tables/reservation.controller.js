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