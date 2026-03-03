import { body, param } from 'express-validator';

/** Crear transacción + allocations */
export const paymentValidator = [
  body('paymentType').optional().isIn(['usd', 'ves']).withMessage('Tipo de pago inválido'),
  body('paymentMethod').optional().trim(),
  body('amount').optional().isFloat({ min: 0 }).withMessage('Monto debe ser un número positivo'),
  body('amountUsd').optional().isFloat({ min: 0 }),
  body('amountBs').optional().isFloat({ min: 0 }),
  body('paidAt').optional().isISO8601().withMessage('Fecha de pago inválida'),
  body('description').optional().trim(),
  body('receipt').optional().isMongoId(),
  body('referenceNumber').optional().trim(),
  body('supportImageUrl').optional().trim(),
  body('allocations').isArray().withMessage('allocations debe ser un array'),
  body('allocations.*.student').isMongoId().withMessage('Estudiante requerido en cada línea'),
  body('allocations.*.cutOffDate').isMongoId().withMessage('Fecha de corte requerida en cada línea'),
  body('allocations.*.amountUsd').optional().isFloat({ min: 0 }),
  body('allocations.*.amountBs').optional().isFloat({ min: 0 }),
];

export const configValidator = [
  body('periodoEscolar').optional().trim(),
  body('period').optional().trim(),
  body('tipo').optional().isIn(['anual', 'mensual', 'quincenal', 'semanal']),
  body('fechaInicio').isISO8601().withMessage('Fecha de inicio requerida'),
  body('fechaFin').isISO8601().withMessage('Fecha de fin requerida'),
  body('montoUsd').optional().isFloat({ min: 0 }),
  body('activo').optional().isBoolean(),
  body().custom((_, { req }) => {
    const periodo = (req.body.periodoEscolar || req.body.period || '').toString().trim();
    if (!periodo) {
      throw new Error('Período escolar requerido (periodoEscolar o period)');
    }
    return true;
  }),
];

export const cutOffValidator = [
  body('config').isMongoId().withMessage('Configuración requerida'),
  body('period').optional().trim(),
  body('fechaCorte').isISO8601().withMessage('Fecha de corte requerida'),
  body('montoUsd').optional().isFloat({ min: 0 }),
  body('activo').optional().isBoolean(),
];

export const updatePaymentValidator = [
  param('id').isMongoId().withMessage('ID inválido'),
  body('paymentType').optional().isIn(['usd', 'ves']),
  body('paymentMethod').optional().trim(),
  body('amount').optional().isFloat({ min: 0 }),
  body('amountUsd').optional().isFloat({ min: 0 }),
  body('amountBs').optional().isFloat({ min: 0 }),
  body('paidAt').optional().isISO8601(),
  body('description').optional().trim(),
  body('referenceNumber').optional().trim(),
  body('supportImageUrl').optional().trim(),
];
