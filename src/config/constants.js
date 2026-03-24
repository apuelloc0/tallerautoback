/**
 * Roles del sistema (2 niveles: alta = DIRECTORA, resto = ADMINISTRADOR/SECRETARIA)
 * DIRECTORA: acceso total
 * ADMINISTRADOR: registro de pagos, solvencias, registro de estudiantes
 * SECRETARIA: consulta de estudiantes y datos académicos de referencia
 */
export const ROLES = {
  DIRECTORA: 'DIRECTORA',
  ADMINISTRADOR: 'ADMINISTRADOR',
  SECRETARIA: 'SECRETARIA',
};

/** Quién puede ver cada recurso */
export const PERMISSIONS = {
  ESTUDIANTES_LISTA: [ROLES.DIRECTORA, ROLES.ADMINISTRADOR, ROLES.SECRETARIA],
  ESTUDIANTES_REGISTRO: [ROLES.DIRECTORA, ROLES.ADMINISTRADOR],
  ESTUDIANTES_MODIFICACION: [ROLES.DIRECTORA, ROLES.ADMINISTRADOR],
  PAGOS_REGISTRO: [ROLES.DIRECTORA, ROLES.ADMINISTRADOR],
  /** Solo consulta: listar pagos, historial, resumen (sin crear/editar) */
  PAGOS_VER: [ROLES.DIRECTORA, ROLES.ADMINISTRADOR],
  SOLVENCIAS: [ROLES.DIRECTORA, ROLES.ADMINISTRADOR],
  USUARIOS_GESTION: [ROLES.DIRECTORA],
  REPORTES: [ROLES.DIRECTORA],
  RESPALDO: [ROLES.DIRECTORA],
};

export const SCHOOL_LEVEL = {
  PREESCOLAR: 'PREESCOLAR',
  PRIMARIA: 'PRIMARIA',
  LICEO: 'LICEO',
};

export const SCHOOL_LEVEL_LIST = Object.values(SCHOOL_LEVEL);

/** Niveles de preescolar (etiqueta en UI: Nivel) */
export const PREESCOLAR_GRADES = ['M1', 'M2', 'M3'];

/** Grados de primaria */
export const PRIMARIA_GRADES = ['1', '2', '3', '4', '5', '6'];

/** Años de liceo */
export const LICEO_GRADES = ['1', '2', '3', '4', '5'];

/** Prefijos moviles Venezuela 04xx (solo digitos, sin espacios; sin lineas fijas 02xx) */
export const PHONE_PREFIXES = [
  '0412', '0414', '0416', '0422', '0424', '0426',
];

/** Cédula: solo parte numérica */
export const CI_DIGITS_MIN = 6;
export const CI_DIGITS_MAX = 9;

/** Tras el prefijo (7 dígitos línea local típica móvil VE) */
export const PHONE_LOCAL_DIGITS = 7;

/** Inscripción: referencia de cupos (global) */
export const INSCRIPTION = {
  YEARS: [1, 2, 3, 4, 5],
  SECTIONS_PER_YEAR: 2,
  TOTAL_SECTIONS: 10,
  CLASSROOMS_AVAILABLE: 13,
  MAX_STUDENTS_PER_SECTION: 40,
};
