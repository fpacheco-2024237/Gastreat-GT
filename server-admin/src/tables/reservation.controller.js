'use strict';

import * as reservationService from './reservation.service.js';

export const getAll = async (req, res, next) => {
  try {
    const { status, tableId } = req.query;
    const items = await reservationService.getAll({ status, tableId });
    res.status(200).json({ success: true, count: items.length, data: items });
  } catch (err) {
    next(err);
  }
};

export const getPending = async (req, res, next) => {
  try {
    const items = await reservationService.getPending();
    res.status(200).json({ success: true, count: items.length, data: items });
  } catch (err) {
    next(err);
  }
};

export const getOne = async (req, res, next) => {
  try {
    const item = req.tableReservation || (await reservationService.getById(req.params.id));
    if (req.user.role !== 'ADMIN_ROLE' && item.createdBy !== req.user.id) {
      return res.status(403).json({ success: false, message: 'No puedes ver una reserva que no creaste' });
    }
    res.status(200).json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
};

export const confirm = async (req, res, next) => {
  try {
    const item = await reservationService.confirm(req.params.id);
    res.status(200).json({ success: true, message: 'Reserva confirmada', data: item });
  } catch (err) {
    next(err);
  }
};

export const cancel = async (req, res, next) => {
  try {
    const item = await reservationService.cancel(
      req.params.id,
      req.body.cancelReason,
      req.user.id,
      req.user.role
    );
    res.status(200).json({ success: true, message: 'Reserva cancelada', data: item });
  } catch (err) {
    next(err);
  }
};