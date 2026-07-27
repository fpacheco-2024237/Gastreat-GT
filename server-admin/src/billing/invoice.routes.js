'use strict';

import { Router } from 'express';
import { body, param } from 'express-validator';
import * as invoiceController from './invoice.controller.js';
import { validateJWT } from '../../middlewares/validate-JWT.js';
import { requireRole } from '../../middlewares/validate-role.js';
import { checkValidators } from '../../middlewares/check-validators.js';

const router = Router();

const validateId = [param('id').isMongoId().withMessage('ID inválido'), checkValidators];
const validateCreate = [body('orderId').isMongoId().withMessage('orderId inválido'), checkValidators];
const validatePay = [
  body('paymentMethod').isIn(['EFECTIVO', 'TARJETA', 'TRANSFERENCIA']).withMessage('Método de pago inválido'),
  checkValidators,
];

router.get('/', validateJWT, requireRole('ADMIN_ROLE'), invoiceController.getAll);
router.get('/:id', validateJWT, requireRole('ADMIN_ROLE'), validateId, invoiceController.getOne);
router.post('/', validateJWT, requireRole('ADMIN_ROLE'), validateCreate, invoiceController.create);
router.patch('/:id/pay', validateJWT, requireRole('ADMIN_ROLE'), validateId, validatePay, invoiceController.markAsPaid);
router.patch('/:id/void', validateJWT, requireRole('ADMIN_ROLE'), validateId, invoiceController.voidInvoice);

export default router;