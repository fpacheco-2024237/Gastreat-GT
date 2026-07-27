'use strict';

import { Router } from 'express';
import * as reservationController from './reservation.controller.js';
import { validateCreateReservation } from '../../middlewares/table-validators.js';
import { validateTableTimes } from '../../middlewares/table-time-validation.js';
import { checkTableReservationConflict } from '../../middlewares/table-conflict.js';

const router = Router();

// validateCreateReservation ya incluye validateJWT + requireRole(ADMIN, USER) + checkValidators
router.post('/reservations', validateCreateReservation, validateTableTimes, checkTableReservationConflict, reservationController.create);

export default router;