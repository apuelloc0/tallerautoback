import { Router } from 'express';
import * as doc from '../controllers/documentController.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { uploadSingle } from '../config/upload.js';
import { param } from 'express-validator';

const router = Router();

router.use(authenticate);
router.use(requirePermission('ESTUDIANTES_LISTA'));

router.get('/', doc.list);
router.post(
  '/',
  uploadSingle('file', 'documents'),
  (req, res, next) => {
    if (!req.body.student) {
      return res.status(400).json({ ok: false, message: 'student requerido.' });
    }
    next();
  },
  doc.create
);
router.delete('/:id', param('id').isMongoId(), validate, doc.remove);

export default router;
