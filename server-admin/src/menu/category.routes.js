'use strict';

import { Router } from 'express';
import { body, param } from 'express-validator';
import * as categoryController from './category.controller.js';
import { validateJWT } from '../../middlewares/validate-JWT.js';
import { requireRole } from '../../middlewares/validate-role.js';
import { checkValidators } from '../../middlewares/check-validators.js';

const router = Router();

const validateCreate = [
  body('name').notEmpty().withMessage('El nombre es requerido').trim(),
  body('restaurantId').isMongoId().withMessage('restaurantId inválido'),
  checkValidators,
];
const validateId = [param('id').isMongoId().withMessage('ID inválido'), checkValidators];

router.get('/', validateJWT, categoryController.getAll);
router.get('/:id', validateJWT, validateId, categoryController.getOne);

router.post('/', validateJWT, requireRole('ADMIN_ROLE'), validateCreate, categoryController.create);
router.put('/:id', validateJWT, requireRole('ADMIN_ROLE'), validateId, categoryController.update);
router.delete('/:id', validateJWT, requireRole('ADMIN_ROLE'), validateId, categoryController.remove);
router.patch('/:id/reactivate', validateJWT, requireRole('ADMIN_ROLE'), validateId, categoryController.reactivate);
router.patch('/:id/status', validateJWT, requireRole('ADMIN_ROLE'), validateId, (req, res, next) => {
  const { status } = req.body;
  if (status === false || status === 'false' || status === 'Inactivo') {
    return categoryController.remove(req, res, next);
  } else {
    return categoryController.reactivate(req, res, next);
  }
});

export default router;