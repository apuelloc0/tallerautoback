import { body, param } from 'express-validator';

/** Validación para crear pago (formulario Nuevo Pago) */
export const paymentValidator = [
  body('student').isMongoId().withMessage('Estudiante requerido'),
  body('cutOffDate').optional().isMongoId().withMessage('Fecha de corte inválida'),
  body('paymentType').optional().isIn(['usd', 'ves', 'dolares', 'bolivares']).withMessage('Tipo de pago inválido'),
  body('paymentMethod').optional().trim(),
  body('amount').optional().isFloat({ min: 0 }).withMessage('Monto debe ser un número positivo'),
  body('amountUsd').optional().isFloat({ min: 0 }),
  body('amountBs').optional().isFloat({ min: 0 }),
  body('paidAt').optional().isISO8601().withMessage('Fecha de pago inválida'),
  body('monthsPaidAmount').optional().isFloat({ min: 0 }),
  body('description').optional().trim(),
  body('exchangeRate').optional().isNumeric(),
  body('exemption.amountExonerated').optional().isNumeric(),
  body('exemption.amountPending').optional().isNumeric(),
];

export const configValidator = [
  body('period').trim().notEmpty().withMessage('Período requerido'),
  body('amountBs').optional().isNumeric(),
  body('amountUsd').optional().isNumeric(),
  body('exchangeRate').optional().isNumeric(),
  body('name').optional().trim(),
];

export const cutOffValidator = [
  body('period').trim().notEmpty().withMessage('Período requerido'),
  body('dueDate').isISO8601().withMessage('Fecha de corte requerida'),
  body('amountUsd').optional().isNumeric(),
  body('amountBs').optional().isNumeric(),
  body('description').optional().trim(),
];

export const updatePaymentValidator = [
  param('id').isMongoId().withMessage('ID inválido'),
  body('student').optional().isMongoId(),
  body('cutOffDate').optional().isMongoId(),
  body('paymentType').optional().isIn(['usd', 'ves', 'dolares', 'bolivares']),
  body('paymentMethod').optional().trim(),
  body('amount').optional().isFloat({ min: 0 }),
  body('amountUsd').optional().isFloat({ min: 0 }),
  body('amountBs').optional().isFloat({ min: 0 }),
  body('paidAt').optional().isISO8601(),
  body('monthsPaidAmount').optional().isFloat({ min: 0 }),
  body('description').optional().trim(),
  body('exemption.amountExonerated').optional().isNumeric(),
  body('exemption.amountPending').optional().isNumeric(),
];
