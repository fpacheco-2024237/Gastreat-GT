'use strict';

import { Router } from 'express';
import { body, param } from 'express-validator';
import * as restaurantController from './restaurant.controller.js';
import { validateJWT } from '../../middlewares/validate-JWT.js';
import { requireRole } from '../../middlewares/validate-role.js';
import { checkValidators } from '../../middlewares/check-validators.js';


const router = Router();

const validateCreate = [
  body('name').notEmpty().withMessage('El nombre es requerido').trim(),
  body('address').notEmpty().withMessage('La dirección es requerida').trim(),
  checkValidators,
];

const validateId = [param('id').isMongoId().withMessage('ID inválido'), checkValidators];


// Public (requires token)
router.get('/', validateJWT, restaurantController.getAll);
router.get('/:id', validateJWT, validateId, restaurantController.getOne);

// Admin (role only)
router.post('/', validateJWT, requireRole('ADMIN_ROLE'), validateCreate, restaurantController.create);
router.put('/:id', validateJWT, requireRole('ADMIN_ROLE'), validateId, restaurantController.update);
router.delete('/:id', validateJWT, requireRole('ADMIN_ROLE'), validateId, restaurantController.remove);
router.patch('/:id/reactivate', validateJWT, requireRole('ADMIN_ROLE'), validateId, restaurantController.reactivate);

export default router;
