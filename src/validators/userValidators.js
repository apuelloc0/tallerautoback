import { body, param } from 'express-validator';
import { ROLES } from '../config/constants.js';

export const createUserValidator = [
  body('username').trim().notEmpty().withMessage('Usuario requerido'),
  body('password').isLength({ min: 6 }).withMessage('Contraseña mínimo 6 caracteres'),
  body('role').isIn(Object.values(ROLES)).withMessage('Rol inválido'),
  body('fullName').optional().trim(),
  body('securityQuestions')
    .isArray({ min: 2, max: 2 })
    .withMessage('Debe registrar exactamente 2 preguntas de seguridad'),
  body('securityQuestions.*.question')
    .trim()
    .notEmpty()
    .withMessage('La pregunta de seguridad es requerida'),
  body('securityQuestions.*.answer')
    .trim()
    .notEmpty()
    .withMessage('La respuesta de seguridad es requerida'),
];

export const updateUserValidator = [
  param('id').isMongoId().withMessage('ID inválido'),
  body('username').optional().trim().notEmpty(),
  body('password').optional().isLength({ min: 6 }),
  body('role').optional().isIn(Object.values(ROLES)),
  body('fullName').optional().trim(),
  body('active').optional().isBoolean(),
  body('securityQuestions').optional().isArray({ min: 2 }),
  body('securityQuestions.*.question').optional().trim().notEmpty(),
  body('securityQuestions.*.answer').optional().trim().notEmpty(),
];
