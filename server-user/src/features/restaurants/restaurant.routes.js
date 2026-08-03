import { Router } from 'express';
import { getAll, getOne } from './restaurant.controller.js';

const router = Router();

router.get('/', getAll);
router.get('/:id', getOne);

export default router;