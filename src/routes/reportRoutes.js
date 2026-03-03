import { Router } from 'express';
import * as report from '../controllers/reportController.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.use(requirePermission('REPORTES'));

router.get('/institutional', report.institutional);
router.get('/occupancy', report.occupancy);
router.get('/enrollment-by-grade-section', report.enrollmentByGradeSection);
router.get('/users-roles', report.usersRoles);

export default router;
