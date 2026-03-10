import { Router } from 'express';
import * as user from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createUserValidator, updateUserValidator } from '../validators/userValidators.js';
import { param } from 'express-validator';

const router = Router();


router.get('/', user.list);
router.get('/:id', param('id').isMongoId(), validate, user.getOne);
router.get('/verify-user/:username', user.verifyUsername);
router.post('/verify-security-answers', user.verifySecurityAnswers);
router.post('/reset-password', user.resetPassword);
router.post('/', createUserValidator, validate, user.create);
router.put('/:id', updateUserValidator, validate, user.update);
router.delete('/:id', param('id').isMongoId(), validate, user.remove);

export default router;
