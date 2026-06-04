'use strict';

import { Router } from 'express';
import { body, param } from 'express-validator';
import * as billingController from './billing.controller.js';
import { verifyToken, isAdmin } from '../../middlewares/auth.middleware.js';
import { validateFields } from '../../middlewares/validate.middleware.js';

const router = Router();

const validatePay = [
    body('orderId').isMongoId().withMessage('orderId inválido'),
    body('paymentMethod')
        .isIn(['Efectivo', 'Tarjeta'])
        .withMessage('Método de pago inválido. Usa: Efectivo | Tarjeta'),
    body('tip').optional().isFloat({ min: 0 }).withMessage('La propina no puede ser negativa'),
    validateFields,
];

router.get('/', verifyToken, isAdmin, billingController.getAll);
router.get('/:orderId', verifyToken, billingController.getByOrderId);
router.post('/pay', verifyToken, validatePay, billingController.pay);

export default router;
