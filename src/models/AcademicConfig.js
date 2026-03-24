import mongoose from 'mongoose';

/**
 * Configuración académica global de la institución.
 *
 * - Años escolares: solo nombres y si están activos.
 * - Períodos: cantidad y nombres de períodos en que se divide el año.
 * - Sistema de calificación: solo guarda la nota mínima para aprobar.
 * - Grados y secciones: nombre del grado y listado de secciones.
 * - Materias: nombre y cantidad de horas semanales.
 */
const schoolYearSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true },
    activo: { type: Boolean, default: false },
  },
  { _id: false }
);

const periodSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true },
    activo: { type: Boolean, default: false },
  },
  { _id: false }
);

const gradeSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true },
    /** PREESCOLAR | PRIMARIA | LICEO (Bachillerato usa LICEO) */
    schoolLevel: {
      type: String,
      enum: ['PREESCOLAR', 'PRIMARIA', 'LICEO'],
      default: 'PRIMARIA',
    },
    secciones: { type: [String], default: [] },
  },
  { _id: false }
);

const subjectSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true },
    horas: { type: Number, default: 0 },
  },
  { _id: false }
);

const generalConfigSchema = new mongoose.Schema(
  {
    nombreInstitucion: { type: String, trim: true, default: 'Unidad Educativa Privada' },
    rif: { type: String, trim: true, default: '' },
    telefono: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, default: '' },
    direccion: { type: String, trim: true, default: '' },
    ciudad: { type: String, trim: true, default: 'Caracas' },
    idioma: { type: String, trim: true, default: 'es' },
    /** Ruta pública servida por el API, ej. /uploads/institution-logo/xxx.png */
    logoUrl: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const academicConfigSchema = new mongoose.Schema(
  {
    general: { type: generalConfigSchema, default: () => ({}) },
    capacidadMaxima: { type: Number, default: 0, min: 0 },
    anosEscolares: { type: [schoolYearSchema], default: [] },
    periodos: { type: [periodSchema], default: [] },
    sistemaCalificacion: {
      // Solo se persiste la nota mínima para aprobar
      notaMinima: { type: Number, required: true, default: 10 },
    },
    grados: { type: [gradeSchema], default: [] },
    materias: { type: [subjectSchema], default: [] },
  },
  { timestamps: true }
);

const AcademicConfig = mongoose.model('AcademicConfig', academicConfigSchema);
export default AcademicConfig;

