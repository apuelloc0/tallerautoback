import { Router } from 'express';
import * as payment from '../controllers/paymentController.js';
import { authenticate } from '../middleware/auth.js';
import { requirePermission } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { paymentValidator, configValidator, cutOffValidator, updatePaymentValidator } from '../validators/paymentValidators.js';
import { param } from 'express-validator';

const router = Router();

router.use(authenticate);

// Configuración de periodo y monto
router.get('/config', requirePermission('PAGOS_REGISTRO'), payment.listConfig);
router.post('/config', requirePermission('PAGOS_REGISTRO'), configValidator, validate, payment.createConfig);
router.put('/config/:id', requirePermission('PAGOS_REGISTRO'), param('id').isMongoId(), validate, payment.updateConfig);

// Fechas de corte
router.get('/cutoff', requirePermission('PAGOS_REGISTRO'), payment.listCutOff);
router.post('/cutoff', requirePermission('PAGOS_REGISTRO'), cutOffValidator, validate, payment.createCutOff);
router.put('/cutoff/:id', requirePermission('PAGOS_REGISTRO'), param('id').isMongoId(), validate, payment.updateCutOff);

// Registro de pagos
router.get('/', requirePermission('PAGOS_REGISTRO'), payment.listPayments);
router.post('/', requirePermission('PAGOS_REGISTRO'), paymentValidator, validate, payment.createPayment);
router.put('/:id', requirePermission('PAGOS_REGISTRO'), updatePaymentValidator, validate, payment.updatePayment);

// Historial e información general
router.get('/history/student/:id', requirePermission('PAGOS_REGISTRO'), param('id').isMongoId(), validate, payment.paymentHistoryByStudent);
router.get('/summary', requirePermission('PAGOS_REGISTRO'), payment.paymentSummary);

// Solvencias
router.get('/solvencies', requirePermission('SOLVENCIAS'), payment.solvencies);

export default router;
