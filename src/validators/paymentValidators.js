import { body, param } from 'express-validator';

export const paymentValidator = [
  body('student').isMongoId().withMessage('Estudiante requerido'),
  body('cutOffDate').isMongoId().withMessage('Fecha de corte requerida'),
  body('amountBs').optional().isNumeric(),
  body('amountUsd').optional().isNumeric(),
  body('exchangeRate').optional().isNumeric(),
  body('paymentMethod').optional().trim(),
  body('paidAt').optional().isISO8601(),
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
  body('amountBs').optional().isNumeric(),
  body('amountUsd').optional().isNumeric(),
  body('exchangeRate').optional().isNumeric(),
  body('paymentMethod').optional().trim(),
  body('paidAt').optional().isISO8601(),
  body('exemption.amountExonerated').optional().isNumeric(),
  body('exemption.amountPending').optional().isNumeric(),
];
