'use strict';

import { Router } from 'express';
import * as reservationController from './reservation.controller.js';
import { validateCreateReservation } from '../../../middlewares/table-validators.js';
import { validateTableTimes } from '../../../middlewares/table-time-validation.js';
import { checkTableReservationConflict } from '../../../middlewares/table-conflict.js';
import { validateJWT } from '../../../middlewares/validate-JWT.js';
import { requireRole, ROLES } from '../../../middlewares/validate-role.js';

const router = Router();

// validateCreateReservation ya incluye validateJWT + requireRole(ADMIN, USER) + checkValidators
router.post('/', validateCreateReservation, validateTableTimes, checkTableReservationConflict, reservationController.create);

router.get('/me', validateJWT, requireRole(ROLES.USER), reservationController.getMyReservations);

router.put('/me/:id/cancel', validateJWT, requireRole(ROLES.USER), reservationController.cancel);

export default router;