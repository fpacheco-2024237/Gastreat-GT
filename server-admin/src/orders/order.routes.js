'use strict';

import { Router } from 'express';
import { body, param } from 'express-validator';
import * as orderController from './order.controller.js';
import { verifyToken, isAdmin, isStaff } from '../../middlewares/auth.middleware.js';
import { validateFields } from '../../middlewares/validate.middleware.js';

const router = Router();

const validateCreate = [
    body('tableId').isMongoId().withMessage('tableId inválido'),
    body('items').isArray({ min: 1 }).withMessage('Debes incluir al menos un platillo'),
    body('items.*.menuItemId').isMongoId().withMessage('menuItemId inválido en items'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('La cantidad debe ser al menos 1'),
    validateFields,
];

const validateStatus = [
    param('id').isMongoId().withMessage('ID inválido'),
    body('status')
        .isIn(['Pendiente', 'Preparando', 'Preparado', 'Entregado', 'Cancelado'])
        .withMessage('Estado inválido'),
    validateFields,
];

router.get('/', verifyToken, orderController.getAll);
router.get('/pending', verifyToken, orderController.getPending);    // Pantalla de cocina
router.get('/:id', verifyToken, orderController.getOne);
router.post('/', verifyToken, isStaff, validateCreate, orderController.create);
router.patch('/:id/status', verifyToken, isStaff, validateStatus, orderController.updateStatus);
router.patch('/:id/add-items', verifyToken, isStaff, orderController.addItems);
router.delete('/:id', verifyToken, isAdmin, orderController.cancel);

export default router;
