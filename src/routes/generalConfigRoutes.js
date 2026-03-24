import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import * as general from '../controllers/generalConfigController.js';
import { uploadSingle } from '../config/upload.js';

const router = Router();

router.use(authenticate);

router.get('/', general.getConfig);
router.put('/', general.updateConfig);
router.post('/logo', uploadSingle('file', 'institution-logo'), general.uploadLogo);

export default router;
