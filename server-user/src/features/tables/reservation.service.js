'use strict';

import TableReservation from './tableReservation.model.js';
import Table from './table.model.js';
import { AppError } from '../../../middlewares/handle-errors.js';

export const create = async (data, createdBy) => {
  const table = await Table.findById(data.tableId);
  if (!table) throw new AppError('Mesa no encontrada', 404);

  return await TableReservation.create({ ...data, createdBy });
};

export const getByUser = async (userId) => {
  return await TableReservation.find({ createdBy: userId }).sort({ createdAt: -1 });
};

export const cancel = async (reservationId, userId) => {
  const reservation = await TableReservation.findById(reservationId);
  if (!reservation) throw new AppError('Reserva no encontrada', 404);
  if (reservation.createdBy !== userId) throw new AppError('No tienes permiso para cancelar esta reserva', 403);
  if (!['PENDIENTE', 'CONFIRMADA'].includes(reservation.status)) {
    throw new AppError(`No se puede cancelar una reserva en estado ${reservation.status}`, 409);
  }
  reservation.status = 'CANCELADA';
  await reservation.save();
  return reservation;
};