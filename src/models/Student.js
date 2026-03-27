import mongoose from 'mongoose';

const guardianSchema = new mongoose.Schema(
  {
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    idNationality: { type: String, enum: ['V', 'E'], default: 'V' },
    idNumber: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true },
    profession: { type: String, trim: true },
  },
  { _id: false }
);

const representativeSchema = new mongoose.Schema(
  {
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    idNationality: { type: String, enum: ['V', 'E'], default: 'V' },
    idNumber: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true },
    relationship: { type: String, enum: ['padre', 'madre', 'hermano', 'otro', ''], default: '' },
    profession: { type: String, trim: true },
  },
  { _id: false }
);

const healthInfoSchema = new mongoose.Schema(
  {
    hasCondition: { type: Boolean, default: false },
    conditionDetails: { type: String, trim: true, default: '' },
    hasAllergies: { type: Boolean, default: false },
    allergiesDetails: { type: String, trim: true, default: '' },
    medications: { type: String, trim: true, default: '' },
    emergencyNotes: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const paymentConfigRefSchema = new mongoose.Schema(
  {
    hasFullScholarship: { type: Boolean, default: false },
    hasDiscount: { type: Boolean, default: false },
    discountType: { type: String, enum: ['pago_total', 'divisas', 'otro'], default: null },
    discountPercentage: { type: Number, min: 0, max: 100 },
    discountAmountUsd: { type: Number, min: 0 },
    exemption: {
      type: { type: String, enum: ['ninguna', 'permanente', 'temporal'], default: 'ninguna' },
      until: Date,
    },
    paymentRepresentative: representativeSchema,
  },
  { _id: false }
);

const studentSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    idNationality: { type: String, enum: ['V', 'E'], default: 'V' },
    idNumber: { type: String, trim: true, default: '' },
    birthDate: { type: Date },
    gender: { type: String, enum: ['masculino', 'femenino', ''], default: '' },
    age: { type: Number },
    address: { type: String, trim: true },
    birthPlace: { type: String, trim: true },
    enrollmentDate: { type: Date },
    /** PREESCOLAR | PRIMARIA | LICEO (vacío = datos históricos sin nivel) */
    schoolLevel: { type: String, enum: ['PREESCOLAR', 'PRIMARIA', 'LICEO', ''], default: '' },
    grade: { type: String, trim: true },
    section: { type: String, trim: true },
    previousInstitution: { type: String, trim: true },
    enrollmentType: { type: String, enum: ['nuevo', 'transferencia', 'reingreso', ''], default: '' },
    email: { type: String, trim: true },
    phone: { type: String, trim: true },
    mother: { type: guardianSchema, default: () => ({}) },
    father: { type: guardianSchema, default: () => ({}) },
    legalRepresentative: { type: String, enum: ['madre', 'padre', 'otro', ''], default: '' },
    representative: { type: representativeSchema, default: () => ({}) },
    studentPhotoUrl: { type: String, trim: true },
    representativePhotoUrl: { type: String, trim: true },
    paymentConfig: { type: paymentConfigRefSchema, default: () => ({}) },
    expedientUrl: { type: String },
    /** Código generado para carnet (preescolar/primaria) */
    childNumber: { type: Number, default: null },
    studentCardNumber: { type: String, trim: true, default: '' },
    healthInfo: { type: healthInfoSchema, default: () => ({}) },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

studentSchema.index({ grade: 1, section: 1 });
studentSchema.index({ schoolLevel: 1, grade: 1, section: 1 });

const Student = mongoose.model('Student', studentSchema);
export default Student;
