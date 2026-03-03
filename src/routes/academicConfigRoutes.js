import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import * as academic from '../controllers/academicConfigController.js';

const router = Router();

router.use(authenticate);

// Configuración académica global
router.get('/', academic.getConfig);
router.put('/', academic.updateConfig);

export default router;

