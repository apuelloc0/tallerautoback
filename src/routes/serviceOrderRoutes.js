import { Router } from 'express';
import * as controller from '../controllers/serviceOrderController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', controller.list);
router.get('/:id', controller.getOne);
router.post('/', controller.create);
router.patch('/:id', controller.update); // Esta es la ruta que permite el PATCH por ID
router.post('/:id/items', controller.addItem); // Ruta para que el técnico agregue repuestos
router.delete('/:id', controller.remove);

export default router;