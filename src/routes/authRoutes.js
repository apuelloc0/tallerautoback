import { Router } from 'express';
import * as auth from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { loginValidator, forgotPasswordValidator, resetPasswordValidator } from '../validators/authValidators.js';

const router = Router();

router.post('/login', loginValidator, validate, auth.login);
router.post('/register', auth.register); // Ahora maneja ambos casos dinámicamente
router.post('/register-owner', auth.registerWorkshopOwner); // Mantener la ruta específica
router.post('/register-employee', auth.registerEmployee);
router.get('/me', authenticate, auth.me);

export default router;
