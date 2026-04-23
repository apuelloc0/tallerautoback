import { Router } from 'express';
import * as controller from '../controllers/billingController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', controller.listInvoices);
router.post('/', controller.createInvoice); // Esta es la ruta que falta y causa el 404
router.post('/payments', controller.addPayment);
router.get('/:id/pdf', controller.invoicePdf);

export default router;