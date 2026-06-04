'use strict';

import { Router } from 'express';
import { body, param } from 'express-validator';
import * as menuController from './menu.controller.js';
import { verifyToken, isAdmin } from '../../middlewares/auth.middleware.js';
import { upload } from '../../middlewares/upload.middleware.js';
import { validateFields } from '../../middlewares/validate.middleware.js';

const router = Router();

const validateCreate = [
    body('name').notEmpty().withMessage('El nombre es requerido').trim(),
    body('price').isFloat({ min: 0 }).withMessage('El precio debe ser un número positivo'),
    body('category')
        .isIn(['Comida', 'Bebida', 'Postre', 'Entrada', 'Otro'])
        .withMessage('Categoría inválida'),
    validateFields,
];

const validateStatus = [
    param('id').isMongoId().withMessage('ID inválido'),
    body('status')
        .isIn(['Disponible', 'Agotado'])
        .withMessage('Estado inválido. Usa: Disponible | Agotado'),
    validateFields,
];

// Rutas públicas (solo requieren token)
router.get('/', verifyToken, menuController.getAll);
router.get('/:id', verifyToken, menuController.getOne);

// Rutas de administrador
router.post('/', verifyToken, isAdmin, upload.single('image'), validateCreate, menuController.create);
router.put('/:id', verifyToken, isAdmin, upload.single('image'), menuController.update);
router.patch('/:id/status', verifyToken, isAdmin, validateStatus, menuController.updateStatus);
router.delete('/:id', verifyToken, isAdmin, menuController.remove);

export default router;
