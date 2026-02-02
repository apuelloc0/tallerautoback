import { body, param } from 'express-validator';
import { ROLES } from '../config/constants.js';

export const createUserValidator = [
  body('username').trim().notEmpty().withMessage('Usuario requerido'),
  body('password').isLength({ min: 6 }).withMessage('Contraseña mínimo 6 caracteres'),
  body('role').isIn(Object.values(ROLES)).withMessage('Rol inválido'),
  body('fullName').optional().trim(),
  body('securityQuestions').optional().isArray(),
];

export const updateUserValidator = [
  param('id').isMongoId().withMessage('ID inválido'),
  body('username').optional().trim().notEmpty(),
  body('password').optional().isLength({ min: 6 }),
  body('role').optional().isIn(Object.values(ROLES)),
  body('fullName').optional().trim(),
  body('active').optional().isBoolean(),
  body('securityQuestions').optional().isArray(),
];
