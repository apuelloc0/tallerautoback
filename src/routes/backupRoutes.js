import { Router } from 'express';
import * as backup from '../controllers/backupController.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.use(requirePermission('RESPALDO'));

router.get('/', backup.listBackups);
router.post('/', backup.createBackup);

export default router;
