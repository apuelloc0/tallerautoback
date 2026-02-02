import { body, param } from 'express-validator';

export const gradeValidator = [
  body('student').isMongoId().withMessage('Estudiante requerido'),
  body('year').isInt({ min: 1 }).withMessage('Año requerido'),
  body('subject').trim().notEmpty().withMessage('Asignatura requerida'),
  body('corte1').optional().isFloat({ min: 0, max: 20 }),
  body('corte2').optional().isFloat({ min: 0, max: 20 }),
  body('corte3').optional().isFloat({ min: 0, max: 20 }),
];
