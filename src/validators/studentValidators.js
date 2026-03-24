import { body, param } from 'express-validator';
import {
  SCHOOL_LEVEL_LIST,
  PHONE_PREFIXES,
  PHONE_LOCAL_DIGITS,
  CI_DIGITS_MIN,
  CI_DIGITS_MAX,
} from '../config/constants.js';

const genderValues = ['masculino', 'femenino', ''];
const enrollmentTypeValues = ['nuevo', 'transferencia', 'reingreso', ''];
const relationshipValues = ['padre', 'madre', 'hermano', 'otro', ''];
const legalRepValues = ['madre', 'padre', 'otro', ''];
const idNat = ['V', 'E'];

const escapedPrefixes = PHONE_PREFIXES.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
const phoneRegex = new RegExp(`^(${escapedPrefixes.join('|')})\\d{${PHONE_LOCAL_DIGITS}}$`);

const ciDigits = (field, required = false) => {
  const chain = body(field).trim();
  if (required) {
    return chain
      .notEmpty()
      .withMessage('Cedula requerida')
      .matches(/^\d+$/)
      .withMessage('La cedula solo debe contener numeros')
      .isLength({ min: CI_DIGITS_MIN, max: CI_DIGITS_MAX })
      .withMessage(`La cedula debe tener entre ${CI_DIGITS_MIN} y ${CI_DIGITS_MAX} digitos`);
  }
  return body(field)
    .optional({ values: 'falsy' })
    .trim()
    .matches(/^\d+$/)
    .withMessage('La cedula solo debe contener numeros')
    .isLength({ min: CI_DIGITS_MIN, max: CI_DIGITS_MAX })
    .withMessage(`La cedula debe tener entre ${CI_DIGITS_MIN} y ${CI_DIGITS_MAX} digitos`);
};

const phoneField = (field, required = false) => {
  const chain = body(field).trim();
  if (required) {
    return chain
      .notEmpty()
      .withMessage('Telefono requerido')
      .matches(phoneRegex)
      .withMessage('Telefono invalido: prefijo movil 04xx permitido y 7 digitos, solo numeros');
  }
  return chain
    .optional({ values: 'falsy' })
    .matches(phoneRegex)
    .withMessage('Telefono invalido: prefijo movil 04xx y 7 digitos, solo numeros');
};

const guardianNested = (prefix) => [
  body(`${prefix}.firstName`).optional().trim(),
  body(`${prefix}.lastName`).optional().trim(),
  body(`${prefix}.idNationality`).optional().isIn(idNat),
  body(`${prefix}.idNumber`)
    .optional({ values: 'falsy' })
    .trim()
    .custom((v) => {
      if (!v) return true;
      if (!/^\d+$/.test(v)) throw new Error('Cedula solo numeros');
      if (v.length < CI_DIGITS_MIN || v.length > CI_DIGITS_MAX) {
        throw new Error(`Cedula: entre ${CI_DIGITS_MIN} y ${CI_DIGITS_MAX} digitos`);
      }
      return true;
    }),
  body(`${prefix}.phone`).optional({ values: 'falsy' }).trim().matches(phoneRegex),
  body(`${prefix}.email`).optional({ values: 'falsy' }).trim().isEmail(),
  body(`${prefix}.profession`).optional().trim(),
];

export const createStudentValidator = [
  body('firstName').trim().notEmpty().withMessage('Nombres requeridos'),
  body('lastName').trim().notEmpty().withMessage('Apellidos requeridos'),
  body('idNationality').optional().isIn(idNat).withMessage('Tipo de documento invalido (V o E)'),
  ciDigits('idNumber', false),
  body('birthDate').optional().isISO8601().withMessage('Fecha de nacimiento invalida'),
  body('gender').optional().isIn(genderValues).withMessage('Sexo invalido'),
  body('address').optional().trim(),
  body('birthPlace').optional().trim(),
  body('enrollmentDate').optional().isISO8601().withMessage('Fecha de inscripcion invalida'),
  body('schoolLevel').optional().isIn([...SCHOOL_LEVEL_LIST, '']).withMessage('Nivel escolar invalido'),
  body('grade').optional({ values: 'null' }).trim(),
  body('section').optional().trim(),
  body('previousInstitution').optional().trim(),
  body('enrollmentType').optional().isIn(enrollmentTypeValues).withMessage('Tipo de ingreso invalido'),
  body('email').optional({ values: 'falsy' }).trim().isEmail().withMessage('Email invalido'),
  phoneField('phone', false),
  body('legalRepresentative').optional().isIn(legalRepValues).withMessage('Representante legal invalido'),
  body('mother').optional().isObject(),
  body('father').optional().isObject(),
  ...guardianNested('mother'),
  ...guardianNested('father'),
  body('representativeFirstName').optional().trim(),
  body('representativeLastName').optional().trim(),
  body('representativeIdNationality').optional().isIn(idNat),
  ciDigits('representativeIdNumber', false),
  body('representativeRelationship').optional().isIn(relationshipValues).withMessage('Parentesco invalido'),
  body('representativeProfession').optional().trim(),
  phoneField('representativePhone', false),
  body('representativeEmail').optional({ values: 'falsy' }).trim().isEmail().withMessage('Email del representante invalido'),
  body('studentPhotoUrl').optional().trim(),
  body('representativePhotoUrl').optional().trim(),
  body('age').optional().isInt({ min: 0 }),
  body('aula').optional().trim(),
  body('paymentConfig').optional().isObject(),
  body('studentCardNumber').optional().trim(),
  body('active').optional().isBoolean(),
];

export const updateStudentValidator = [
  param('id').isMongoId().withMessage('ID invalido'),
  body('firstName').optional().trim().notEmpty(),
  body('lastName').optional().trim().notEmpty(),
  body('idNationality').optional().isIn(idNat),
  ciDigits('idNumber', false),
  body('birthDate').optional().isISO8601(),
  body('gender').optional().isIn(genderValues),
  body('address').optional().trim(),
  body('birthPlace').optional().trim(),
  body('enrollmentDate').optional().isISO8601(),
  body('schoolLevel').optional().isIn([...SCHOOL_LEVEL_LIST, '']),
  body('grade').optional({ values: 'null' }).trim(),
  body('section').optional().trim(),
  body('previousInstitution').optional().trim(),
  body('enrollmentType').optional().isIn(enrollmentTypeValues),
  body('email').optional({ values: 'falsy' }).trim().isEmail(),
  phoneField('phone', false),
  body('legalRepresentative').optional().isIn(legalRepValues),
  body('mother').optional().isObject(),
  body('father').optional().isObject(),
  ...guardianNested('mother'),
  ...guardianNested('father'),
  body('representativeFirstName').optional().trim(),
  body('representativeLastName').optional().trim(),
  body('representativeIdNationality').optional().isIn(idNat),
  ciDigits('representativeIdNumber', false),
  body('representativeRelationship').optional().isIn(relationshipValues),
  body('representativeProfession').optional().trim(),
  phoneField('representativePhone', false),
  body('representativeEmail').optional({ values: 'falsy' }).trim().isEmail(),
  body('studentPhotoUrl').optional().trim(),
  body('representativePhotoUrl').optional().trim(),
  body('age').optional().isInt({ min: 0 }),
  body('aula').optional().trim(),
  body('paymentConfig').optional().isObject(),
  body('studentCardNumber').optional().trim(),
  body('active').optional().isBoolean(),
];
