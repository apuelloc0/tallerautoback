import { Router } from 'express';
import * as controller from '../controllers/generalConfigController.js';
import { authenticate } from '../middleware/auth.js';
import { uploadSingle } from '../config/upload.js';

const router = Router();

router.get('/public', controller.getPublicInfo);

router.use(authenticate);
router.get('/', controller.getConfig);
router.put('/', controller.updateConfig);
router.post('/logo', uploadSingle('file', 'institution-logo'), controller.uploadLogo);

export default router;