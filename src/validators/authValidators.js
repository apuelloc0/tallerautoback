import { body } from 'express-validator';

export const loginValidator = [
  body('username').trim().notEmpty().withMessage('Usuario requerido'),
  body('password').notEmpty().withMessage('Contraseña requerida'),
];

export const forgotPasswordValidator = [
  body('username').trim().notEmpty().withMessage('Usuario requerido'),
  body('answers').isArray().withMessage('Respuestas deben ser un array'),
];

export const resetPasswordValidator = [
  body('resetToken').notEmpty().withMessage('Token requerido'),
  body('newPassword').isLength({ min: 6 }).withMessage('Contraseña mínimo 6 caracteres'),
];
