import { Router } from 'express';
import * as receipt from '../controllers/receiptController.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { uploadSingle } from '../config/upload.js';
import { param } from 'express-validator';

const router = Router();

router.use(authenticate);
router.use(requirePermission('PAGOS_REGISTRO'));

router.post('/', uploadSingle('file', 'receipts'), receipt.create);
router.get('/:id', param('id').isMongoId(), validate, receipt.getOne);

export default router;
