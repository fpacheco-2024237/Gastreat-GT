'use strict';

import { Router } from 'express';
import { body, param } from 'express-validator';
import * as orderController from './order.controller.js';
import { validateJWT } from '../../middlewares/validate-JWT.js';
import { requireRole } from '../../middlewares/validate-role.js';
import { checkValidators } from '../../middlewares/check-validators.js';
import { ORDER_STATUSES } from './order.model.js';

const router = Router();

const validateId = [param('id').isMongoId().withMessage('ID inválido'), checkValidators];
const validateStatus = [
  body('status').isIn(ORDER_STATUSES).withMessage(`Estado inválido. Valores permitidos: ${ORDER_STATUSES.join(', ')}`),
  checkValidators,
];

router.get('/', validateJWT, requireRole('ADMIN_ROLE'), orderController.getAll);
router.get('/:id', validateJWT, requireRole('ADMIN_ROLE'), validateId, orderController.getOne);
router.patch('/:id/status', validateJWT, requireRole('ADMIN_ROLE'), validateId, validateStatus, orderController.updateStatus);
router.patch('/:id/cancel', validateJWT, requireRole('ADMIN_ROLE'), validateId, orderController.cancel);

export default router;