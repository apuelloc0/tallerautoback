import { Router } from 'express';
import * as student from '../controllers/studentController.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createStudentValidator, updateStudentValidator } from '../validators/studentValidators.js';
import { uploadSingle } from '../config/upload.js';
import { param } from 'express-validator';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission('ESTUDIANTES_LISTA'), student.list);
router.get('/quota', requirePermission('ESTUDIANTES_LISTA'), student.quotaStatus);
router.get('/report/pdf', requirePermission('ESTUDIANTES_LISTA'), student.reportPdf);
router.get('/:id', requirePermission('ESTUDIANTES_LISTA'), param('id').isMongoId(), validate, student.getOne);
router.post('/', requirePermission('ESTUDIANTES_REGISTRO'), createStudentValidator, validate, student.create);
router.put('/:id', requirePermission('ESTUDIANTES_MODIFICACION'), updateStudentValidator, validate, student.update);
router.post(
  '/:id/expedient',
  requirePermission('ESTUDIANTES_MODIFICACION'),
  param('id').isMongoId(),
  validate,
  uploadSingle('file', 'expedients'),
  student.uploadExpedient
);
router.post(
  '/:id/foto-alumno',
  requirePermission('ESTUDIANTES_MODIFICACION'),
  param('id').isMongoId(),
  validate,
  uploadSingle('file', 'fotos-alumno'),
  student.uploadFotoAlumno
);
router.post(
  '/:id/foto-representante',
  requirePermission('ESTUDIANTES_MODIFICACION'),
  param('id').isMongoId(),
  validate,
  uploadSingle('file', 'fotos-representante'),
  student.uploadFotoRepresentante
);

export default router;
