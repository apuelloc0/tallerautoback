import { Router } from 'express';
import * as controller from '../controllers/dashboardController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', controller.getStats);

export default router;