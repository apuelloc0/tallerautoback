import { Router } from 'express';
import * as controller from '../controllers/inventoryController.js';
import { authenticate } from '../middleware/auth.js';
import { checkSubscription } from '../middleware/subscription.js';

const router = Router();

router.use(authenticate);
// Bloqueo automático si el taller no ha pagado
router.use(checkSubscription);

router.get('/', controller.list);
router.post('/', controller.create);
router.patch('/:id', controller.update);
router.delete('/:id', controller.remove);

export default router;