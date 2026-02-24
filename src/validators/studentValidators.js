import { body, param } from 'express-validator';

const grades = ['7', '8', '9', '10', '11', '12'];
const sections = ['A', 'B', 'C', 'D'];
const genderValues = ['masculino', 'femenino'];
const enrollmentTypeValues = ['nuevo', 'transferencia', 'reingreso'];
const relationshipValues = ['padre', 'madre', 'hermano', 'otro'];

export const createStudentValidator = [
  body('firstName').trim().notEmpty().withMessage('Nombres requeridos'),
  body('lastName').trim().notEmpty().withMessage('Apellidos requeridos'),
  body('idNumber').trim().notEmpty().withMessage('Cédula requerida'),
  body('birthDate').optional().isISO8601().withMessage('Fecha de nacimiento inválida'),
  body('gender').optional().isIn(genderValues).withMessage('Sexo inválido'),
  body('address').optional().trim(),
  body('birthPlace').optional().trim(),
  body('enrollmentDate').optional().isISO8601().withMessage('Fecha de inscripción inválida'),
  body('grade').optional().isIn(grades).withMessage('Grado inválido'),
  body('section').optional().isIn(sections).withMessage('Sección inválida'),
  body('previousInstitution').optional().trim(),
  body('enrollmentType').optional().isIn(enrollmentTypeValues).withMessage('Tipo de ingreso inválido'),
  body('email').optional().trim().isEmail().withMessage('Email inválido'),
  body('phone').optional().trim(),
  body('representativeFirstName').optional().trim(),
  body('representativeLastName').optional().trim(),
  body('representativeIdNumber').optional().trim(),
  body('representativeRelationship').optional().isIn(relationshipValues).withMessage('Parentezco inválido'),
  body('representativeProfession').optional().trim(),
  body('studentPhotoUrl').optional().trim(),
  body('representativePhotoUrl').optional().trim(),
  body('age').optional().isInt({ min: 0 }),
  body('aula').optional().trim(),
  body('paymentConfig').optional().isObject(),
];

export const updateStudentValidator = [
  param('id').isMongoId().withMessage('ID inválido'),
  body('firstName').optional().trim().notEmpty(),
  body('lastName').optional().trim().notEmpty(),
  body('idNumber').optional().trim().notEmpty(),
  body('birthDate').optional().isISO8601(),
  body('gender').optional().isIn(genderValues),
  body('address').optional().trim(),
  body('birthPlace').optional().trim(),
  body('enrollmentDate').optional().isISO8601(),
  body('grade').optional().isIn(grades),
  body('section').optional().isIn(sections),
  body('previousInstitution').optional().trim(),
  body('enrollmentType').optional().isIn(enrollmentTypeValues),
  body('email').optional().trim().isEmail(),
  body('phone').optional().trim(),
  body('representativeFirstName').optional().trim(),
  body('representativeLastName').optional().trim(),
  body('representativeIdNumber').optional().trim(),
  body('representativeRelationship').optional().isIn(relationshipValues),
  body('representativeProfession').optional().trim(),
  body('studentPhotoUrl').optional().trim(),
  body('representativePhotoUrl').optional().trim(),
  body('age').optional().isInt({ min: 0 }),
  body('aula').optional().trim(),
  body('paymentConfig').optional().isObject(),
];
