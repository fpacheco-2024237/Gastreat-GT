'use strict';

import { Router } from 'express';
import { body, param } from 'express-validator';
import * as tableController from './table.controller.js';
import { verifyToken, isAdmin } from '../../middlewares/auth.middleware.js';
import { validateFields } from '../../middlewares/validate.middleware.js';

const router = Router();

const validateCreate = [
    body('number').isInt({ min: 1 }).withMessage('El número de mesa debe ser entero positivo'),
    body('capacity').isInt({ min: 1, max: 20 }).withMessage('Capacidad entre 1 y 20'),
    validateFields,
];

const validateStatus = [
    param('id').isMongoId().withMessage('ID inválido'),
    body('status')
        .isIn(['Libre', 'Ocupada', 'Sucia'])
        .withMessage('Estado inválido. Usa: Libre | Ocupada | Sucia'),
    validateFields,
];

router.get('/', verifyToken, tableController.getAll);
router.get('/:id', verifyToken, tableController.getOne);
router.post('/', verifyToken, isAdmin, validateCreate, tableController.create);
router.put('/:id', verifyToken, isAdmin, tableController.update);
router.patch('/:id/status', verifyToken, validateStatus, tableController.updateStatus);
router.delete('/:id', verifyToken, isAdmin, tableController.remove);

export default router;
