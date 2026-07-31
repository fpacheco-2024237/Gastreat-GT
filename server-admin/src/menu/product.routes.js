'use strict';

import { Router } from 'express';
import { body, param } from 'express-validator';
import * as productController from './product.controller.js';
import { validateJWT } from '../../middlewares/validate-JWT.js';
import { requireRole } from '../../middlewares/validate-role.js';
import { checkValidators } from '../../middlewares/check-validators.js';
import { upload } from '../../middlewares/upload.middleware.js';
import { cleanupUploadedFileOnFinish } from '../../middlewares/delete-file-on-error.js';

const router = Router();

const validateCreate = [
  body('name').notEmpty().withMessage('El nombre es requerido').trim(),
  body('price').isFloat({ min: 0 }).withMessage('El precio debe ser un número positivo'),
  body('stock').isInt({ min: 0 }).withMessage('El stock debe ser un entero positivo'),
  body('categoryId').isMongoId().withMessage('categoryId inválido'),
  body('restaurantId').isMongoId().withMessage('restaurantId inválido'),
  checkValidators,
];
const validateUpdate = [
  body('price').optional().isFloat({ min: 0 }).withMessage('El precio debe ser un número positivo'),
  body('stock').optional().isInt({ min: 0 }).withMessage('El stock debe ser un entero positivo'),
  body('categoryId').optional().isMongoId().withMessage('categoryId inválido'),
  checkValidators,
];
const validateId = [param('id').isMongoId().withMessage('ID inválido'), checkValidators];

router.get('/', validateJWT, productController.getAll);
router.get('/:id', validateJWT, validateId, productController.getOne);

router.post(
  '/',
  validateJWT,
  requireRole('ADMIN_ROLE'),
  upload.single('image'),
  cleanupUploadedFileOnFinish,
  validateCreate,
  productController.create
);
router.put(
  '/:id',
  validateJWT,
  requireRole('ADMIN_ROLE'),
  upload.single('image'),
  cleanupUploadedFileOnFinish,
  validateId,
  validateUpdate,
  productController.update
);
router.delete('/:id', validateJWT, requireRole('ADMIN_ROLE'), validateId, productController.remove);
router.patch('/:id/reactivate', validateJWT, requireRole('ADMIN_ROLE'), validateId, productController.reactivate);

export default router;