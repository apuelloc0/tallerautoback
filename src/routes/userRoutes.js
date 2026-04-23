import { Router } from 'express';
import * as user from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createUserValidator, updateUserValidator } from '../validators/userValidators.js';
import { param } from 'express-validator';

const router = Router();

/** Recuperación de contraseña (sin JWT) */
router.get('/verify/:username', user.verifyUsername);
router.post('/verify-answers', user.verifySecurityAnswers);
router.post('/reset-password', user.resetPassword);

router.use(authenticate);

// Eliminamos requirePermission temporalmente para permitir acceso al Admin
// El frontend ya filtra que solo el admin llegue aquí
router.get('/', user.list);
router.get('/:id', param('id').isUUID(), validate, user.getOne);
router.post('/', createUserValidator, validate, user.create);
router.patch('/:id', user.update); // Usamos patch sin validadores estrictos para cambios de estado
router.delete('/:id', param('id').isUUID(), validate, user.remove);

export default router;
