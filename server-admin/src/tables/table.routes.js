'use strict';

import { Router } from 'express';
import { param } from 'express-validator';
import * as tableController from './table.controller.js';
import * as reservationController from './reservation.controller.js';
import { checkValidators } from '../../middlewares/check-validators.js';
import { checkTableReservationConflict } from '../../middlewares/table-conflict.js';
import {
  validateGetTables,
  validateGetTableById,
  validateCreateTable,
  validateUpdateTable,
  validateTableStatusChange,
  validateDeleteTable,
  validateGetReservations,
  validateGetPendingReservations,
  validateGetReservationById,
  validateConfirmReservation,
  validateCancelReservation,
} from '../../middlewares/table-validators.js';

const router = Router();

// ── Mesas ──
router.get('/tables', validateGetTables, tableController.getAll);
router.get('/tables/:id', validateGetTableById, tableController.getOne);
router.post('/tables', validateCreateTable, tableController.create);
router.put('/tables/:id', validateUpdateTable, tableController.update);
router.patch('/tables/:id/status', validateTableStatusChange, tableController.changeStatus);
router.delete('/tables/:id', validateDeleteTable, tableController.remove);

// ── Reservas (creación vive en server-user) ──
router.get('/reservations', validateGetReservations, reservationController.getAll);
router.get('/reservations/pending', validateGetPendingReservations, reservationController.getPending);
router.get(
  '/reservations/:id',
  validateGetReservationById,
  checkTableReservationConflict.length ? (req, res, next) => next() : (req, res, next) => next(), // no-op: el conflicto solo aplica a creación/confirmación
  reservationController.getOne
);
router.put('/reservations/:id/confirm', validateConfirmReservation, checkTableReservationConflict, reservationController.confirm);
router.put('/reservations/:id/cancel', validateCancelReservation, reservationController.cancel);

export default router;