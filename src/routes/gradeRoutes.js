import { Router } from 'express';
import * as grade from '../controllers/gradeController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { gradeValidator } from '../validators/gradeValidators.js';
import { param } from 'express-validator';

const router = Router();

router.use(authenticate);

router.get('/', grade.list);
router.get('/best', grade.bestGrades);
router.get('/:id', param('id').isMongoId(), validate, grade.getOne);
router.post('/', gradeValidator, validate, grade.create);
router.put('/:id', param('id').isMongoId(), gradeValidator, validate, grade.update);
router.post('/bulk', grade.bulkUpsert);

export default router;
