import { Router } from 'express';
import * as report from '../controllers/reportController.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.use(requirePermission('REPORTES'));

router.get('/institutional', report.institutional);

export default router;
