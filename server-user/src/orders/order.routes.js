'use strict';

import { Router } from 'express';
import { body } from 'express-validator';
import * as orderController from './order.controller.js';
import { validateJWT } from '../../middlewares/validate-JWT.js';
import { requireRole, ROLES } from '../../middlewares/validate-role.js';
import { checkValidators } from '../../middlewares/check-validators.js';

const router = Router();

const validateCreate = [
  body('restaurantId').isMongoId().withMessage('restaurantId inválido'),
  body('tableId').optional().isMongoId().withMessage('tableId inválido'),
  body('items').isArray({ min: 1 }).withMessage('items debe ser un arreglo con al menos un elemento'),
  body('items.*.productId').isMongoId().withMessage('productId inválido'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('quantity debe ser un entero positivo'),
  checkValidators,
];

router.post('/', validateJWT, requireRole(ROLES.ADMIN, ROLES.USER), validateCreate, orderController.create);

export default router;