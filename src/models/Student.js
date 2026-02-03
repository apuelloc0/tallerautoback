import mongoose from 'mongoose';
import { INSCRIPTION } from '../config/constants.js';

const representativeSchema = new mongoose.Schema(
  {

    // Campos del formulario (representante legal)
    nombres: { type: String, trim: true },
    apellidos: { type: String, trim: true },
    cedula: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true },
    parentezco: { type: String, enum: ['padre', 'madre', 'hermano', 'otro', ''], default: '' },
    profesion: { type: String, trim: true },
  },
  { _id: false }
);

const paymentConfigRefSchema = new mongoose.Schema(
  {
    hasBecaTotal: { type: Boolean, default: false },
    hasDescuento: { type: Boolean, default: false },
    descuentoType: { type: String, enum: ['pago_total', 'divisas', 'otro'], default: null },
    exoneracion: {
      type: { type: String, enum: ['ninguna', 'permanente', 'temporal'], default: 'ninguna' },
      until: Date,
    },
    paymentRepresentative: representativeSchema,
  },
  { _id: false }
);

const studentSchema = new mongoose.Schema(
  {
    // Información personal (alumno)
    nombres: { type: String, required: true, trim: true },
    apellidos: { type: String, required: true, trim: true },
    cedula: { type: String, required: true, trim: true },
    fechaNacimiento: { type: Date },
    sexo: { type: String, enum: ['masculino', 'femenino', ''], default: '' },
    genero: { type: String, enum: ['M', 'F', 'Otro'], trim: true },
    edad: { type: Number },
    // Ubicación
    direccion: { type: String, trim: true },
    lugarNacimiento: { type: String, trim: true },
    // Información académica
    fechaInscripcion: { type: Date },
    grado: { type: String, trim: true }, // "7", "8", ... "12"
    seccion: { type: String, trim: true }, // "A", "B", "C", "D"
    institucionProveniente: { type: String, trim: true },
    tipoIngreso: { type: String, enum: ['nuevo', 'transferencia', 'reingreso', ''], default: '' },
    // Contacto
    email: { type: String, trim: true },
    telefono: { type: String, trim: true },
    // Representante legal
    representative: { type: representativeSchema, default: () => ({}) },
    // Documentación (URLs de archivos subidos)
    fotoAlumno: { type: String, trim: true },
    fotoRepresentante: { type: String, trim: true },
    paymentConfig: { type: paymentConfigRefSchema, default: () => ({}) },
    expedientUrl: { type: String },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

studentSchema.index({ ci: 1 }, { unique: true, sparse: true });
studentSchema.index({ cedula: 1 }, { unique: true, sparse: true });
studentSchema.index({ year: 1, section: 1 });
studentSchema.index({ grado: 1, seccion: 1 });
studentSchema.index({ name: 1 });
studentSchema.index({ nombres: 1, apellidos: 1 });

// Pre-save: mantener name y ci en sincronía con nombres/apellidos y cedula
studentSchema.pre('save', function (next) {
  if (this.nombres || this.apellidos) {
    this.name = [this.nombres, this.apellidos].filter(Boolean).join(' ').trim() || this.name;
  }
  if (this.cedula) this.ci = this.ci || this.cedula;
  if (this.grado && !this.year) this.year = parseInt(this.grado, 10);
  if (this.seccion && !this.section) this.section = this.seccion;
  if (this.tipoIngreso && !this.enrollmentType) {
    const map = { nuevo: 'nuevo_ingreso', transferencia: 'transferencia', reingreso: 'reingreso' };
    this.enrollmentType = map[this.tipoIngreso] || this.tipoIngreso;
  }
  next();
});

const Student = mongoose.model('Student', studentSchema);
export default Student;
