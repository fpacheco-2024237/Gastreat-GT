'use strict';

import TableReservation from './tableReservation.model.js';
import { AppError } from '../../middlewares/handle-errors.js';
import { getById as getTableById, changeStatus as changeTableStatus } from './table.service.js';

export const getAll = async (filters = {}) => {
  const query = {};
  if (filters.status) query.status = filters.status;
  if (filters.tableId) query.tableId = filters.tableId;
  return await TableReservation.find(query).sort({ startTime: 1 });
};

export const getPending = async () => {
  return await TableReservation.find({ status: 'PENDIENTE' }).sort({ startTime: 1 });
};

export const getById = async (id) => {
  const reservation = await TableReservation.findById(id);
  if (!reservation) throw new AppError('Reserva no encontrada', 404);
  return reservation;
};

/**
 * Crea la reserva. Se asume que `checkTableReservationConflict` (middleware, en
 * la ruta) ya validó que no hay solapamiento antes de llegar aquí.
 */
export const create = async (data, createdBy) => {
  await getTableById(data.tableId);
  const reservation = await TableReservation.create({ ...data, createdBy });
  return reservation;
};

export const confirm = async (id) => {
  const reservation = await getById(id);
  if (reservation.status !== 'PENDIENTE') {
    throw new AppError(`No se puede confirmar una reserva en estado ${reservation.status}`, 409);
  }
  reservation.status = 'CONFIRMADA';
  await reservation.save();
  await changeTableStatus(reservation.tableId, 'RESERVADA');
  return reservation;
};

export const cancel = async (id, cancelReason, requesterId, requesterRole) => {
  const reservation = await getById(id);

  if (requesterRole !== 'ADMIN_ROLE' && reservation.createdBy !== requesterId) {
    throw new AppError('No puedes cancelar una reserva que no creaste', 403);
  }
  if (reservation.status === 'CANCELADA' || reservation.status === 'COMPLETADA') {
    throw new AppError(`No se puede cancelar una reserva en estado ${reservation.status}`, 409);
  }

  reservation.status = 'CANCELADA';
  reservation.cancelReason = cancelReason || null;
  await reservation.save();

  const table = await getTableById(reservation.tableId);
  if (table.status === 'RESERVADA') {
    await changeTableStatus(reservation.tableId, 'LIBRE');
  }
  return reservation;
};