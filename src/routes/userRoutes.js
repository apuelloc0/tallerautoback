import { Router } from 'express';
import * as user from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createUserValidator, updateUserValidator } from '../validators/userValidators.js';
import { param } from 'express-validator';

const router = Router();

/** Recuperación de contraseña (sin JWT) */
router.get('/verify-user/:username', user.verifyUsername);
router.post('/verify-security-answers', user.verifySecurityAnswers);
router.post('/reset-password', user.resetPassword);

router.use(authenticate);

router.get('/', requirePermission('USUARIOS_GESTION'), user.list);
router.get('/:id', requirePermission('USUARIOS_GESTION'), param('id').isMongoId(), validate, user.getOne);
router.post('/', requirePermission('USUARIOS_GESTION'), createUserValidator, validate, user.create);
router.put('/:id', requirePermission('USUARIOS_GESTION'), updateUserValidator, validate, user.update);
router.delete('/:id', requirePermission('USUARIOS_GESTION'), param('id').isMongoId(), validate, user.remove);

export default router;
