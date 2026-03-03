import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import * as dashboard from '../controllers/dashboardController.js';

const router = Router();

router.use(authenticate);

router.get('/', dashboard.getStats);

export default router;
