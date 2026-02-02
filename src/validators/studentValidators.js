import { body, param } from 'express-validator';
import { INSCRIPTION } from '../config/constants.js';

const grados = ['7', '8', '9', '10', '11', '12'];
const secciones = ['A', 'B', 'C', 'D'];
const sexoValues = ['masculino', 'femenino'];
const tipoIngresoValues = ['nuevo', 'transferencia', 'reingreso'];
const parentezcoValues = ['padre', 'madre', 'hermano', 'otro'];

export const createStudentValidator = [
  body('nombres').trim().notEmpty().withMessage('Nombres requeridos'),
  body('apellidos').trim().notEmpty().withMessage('Apellidos requeridos'),
  body('cedula').trim().notEmpty().withMessage('Cédula requerida'),
  body('fechaNacimiento').optional().isISO8601().withMessage('Fecha de nacimiento inválida'),
  body('sexo').optional().isIn(sexoValues).withMessage('Sexo inválido'),
  body('direccion').optional().trim(),
  body('lugarNacimiento').optional().trim(),
  body('fechaInscripcion').optional().isISO8601().withMessage('Fecha de inscripción inválida'),
  body('grado').optional().isIn(grados).withMessage('Grado inválido'),
  body('seccion').optional().isIn(secciones).withMessage('Sección inválida'),
  body('institucionProveniente').optional().trim(),
  body('tipoIngreso').optional().isIn(tipoIngresoValues).withMessage('Tipo de ingreso inválido'),
  body('email').optional().trim().isEmail().withMessage('Email inválido'),
  body('telefono').optional().trim(),
  body('nombresRepresentante').optional().trim(),
  body('apellidosRepresentante').optional().trim(),
  body('cedulaRepresentante').optional().trim(),
  body('parentezco').optional().isIn(parentezcoValues).withMessage('Parentezco inválido'),
  body('profesionRepresentante').optional().trim(),
  body('fotoAlumno').optional().trim(),
  body('fotoRepresentante').optional().trim(),
  body('name').optional().trim(),
  body('edad').optional().isInt({ min: 0 }),
  body('genero').optional().isIn(['M', 'F', 'Otro']),
  body('aula').optional().trim(),
  body('enrollmentType').optional().isIn(['nuevo_ingreso', 'regular', 'nuevo', 'transferencia', 'reingreso']),
  body('paymentConfig').optional().isObject(),
];

export const updateStudentValidator = [
  param('id').isMongoId().withMessage('ID inválido'),
  body('nombres').optional().trim().notEmpty(),
  body('apellidos').optional().trim().notEmpty(),
  body('cedula').optional().trim().notEmpty(),
  body('fechaNacimiento').optional().isISO8601(),
  body('sexo').optional().isIn(sexoValues),
  body('direccion').optional().trim(),
  body('lugarNacimiento').optional().trim(),
  body('fechaInscripcion').optional().isISO8601(),
  body('grado').optional().isIn(grados),
  body('seccion').optional().isIn(secciones),
  body('institucionProveniente').optional().trim(),
  body('tipoIngreso').optional().isIn(tipoIngresoValues),
  body('email').optional().trim().isEmail(),
  body('telefono').optional().trim(),
  body('nombresRepresentante').optional().trim(),
  body('apellidosRepresentante').optional().trim(),
  body('cedulaRepresentante').optional().trim(),
  body('parentezco').optional().isIn(parentezcoValues),
  body('profesionRepresentante').optional().trim(),
  body('fotoAlumno').optional().trim(),
  body('fotoRepresentante').optional().trim(),
  body('name').optional().trim().notEmpty(),
  body('ci').optional().trim().notEmpty(),
  body('year').optional().isIn([...INSCRIPTION.YEARS, 7, 8, 9, 10, 11, 12]),
  body('section').optional().trim().notEmpty(),
  body('edad').optional().isInt({ min: 0 }),
  body('genero').optional().isIn(['M', 'F', 'Otro']),
  body('aula').optional().trim(),
  body('enrollmentType').optional().isIn(['nuevo_ingreso', 'regular', 'nuevo', 'transferencia', 'reingreso']),
  body('paymentConfig').optional().isObject(),
];
