import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/auth.js';
import { ROLES } from '../config/constants.js';
import * as dashboard from '../controllers/dashboardController.js';

const router = Router();

router.use(authenticate);
router.use(requireRole(ROLES.DIRECTORA, ROLES.ADMINISTRADOR, ROLES.SECRETARIA));

router.get('/', dashboard.getStats);

export default router;
