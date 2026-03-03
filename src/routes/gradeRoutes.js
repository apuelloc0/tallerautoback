import { Router } from 'express';
import * as grade from '../controllers/gradeController.js';
import { authenticate, requirePermission } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { gradeValidator } from '../validators/gradeValidators.js';
import { param } from 'express-validator';

const router = Router();

router.use(authenticate);

// Consulta (directora, administrador, secretaria)
router.get('/', requirePermission('NOTAS_VER'), grade.list);
router.get('/best', requirePermission('NOTAS_VER'), grade.bestGrades);
router.get('/:id', requirePermission('NOTAS_VER'), param('id').isMongoId(), validate, grade.getOne);
// Crear/editar solo directora y administrador
router.post('/', requirePermission('NOTAS_REGISTRO'), gradeValidator, validate, grade.create);
router.put('/:id', requirePermission('NOTAS_REGISTRO'), param('id').isMongoId(), gradeValidator, validate, grade.update);
router.post('/bulk', requirePermission('NOTAS_REGISTRO'), grade.bulkUpsert);

export default router;
