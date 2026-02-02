import { Router } from 'express';
import * as user from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createUserValidator, updateUserValidator } from '../validators/userValidators.js';
import { param } from 'express-validator';

const router = Router();

router.use(authenticate);
router.use(requirePermission('USUARIOS_GESTION'));

router.get('/', user.list);
router.get('/:id', param('id').isMongoId(), validate, user.getOne);
router.post('/', createUserValidator, validate, user.create);
router.put('/:id', updateUserValidator, validate, user.update);
router.delete('/:id', param('id').isMongoId(), validate, user.remove);

export default router;
