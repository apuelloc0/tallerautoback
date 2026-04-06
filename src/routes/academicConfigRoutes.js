import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/auth.js';
import { ROLES } from '../config/constants.js';
import * as academic from '../controllers/academicConfigController.js';

const router = Router();

router.use(authenticate);
router.use(requireRole(ROLES.DIRECTORA));

// Configuración académica global
router.get('/', academic.getConfig);
router.put('/', academic.updateConfig);

export default router;

