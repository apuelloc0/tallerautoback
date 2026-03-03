import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import * as general from '../controllers/generalConfigController.js';

const router = Router();

router.use(authenticate);

router.get('/', general.getConfig);
router.put('/', general.updateConfig);

export default router;
