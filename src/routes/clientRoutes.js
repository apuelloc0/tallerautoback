import { Router } from 'express';
import * as controller from '../controllers/clientController.js';
import { authenticate } from '../middleware/auth.js';
import { checkSubscription } from '../middleware/subscription.js';

const router = Router();

router.use(authenticate);
// Solo permitimos operar si la suscripción está activa
router.use(checkSubscription);

router.get('/', controller.list);
router.get('/:id', controller.getOne);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

export default router;