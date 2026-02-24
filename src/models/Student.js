import mongoose from 'mongoose';

const representativeSchema = new mongoose.Schema(
  {
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    idNumber: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true },
    relationship: { type: String, enum: ['padre', 'madre', 'hermano', 'otro', ''], default: '' },
    profession: { type: String, trim: true },
  },
  { _id: false }
);

const paymentConfigRefSchema = new mongoose.Schema(
  {
    hasFullScholarship: { type: Boolean, default: false },
    hasDiscount: { type: Boolean, default: false },
    discountType: { type: String, enum: ['pago_total', 'divisas', 'otro'], default: null },
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
    idNumber: { type: String, required: true, trim: true },
    birthDate: { type: Date },
    gender: { type: String, enum: ['masculino', 'femenino', ''], default: '' },
    age: { type: Number },
    address: { type: String, trim: true },
    birthPlace: { type: String, trim: true },
    enrollmentDate: { type: Date },
    grade: { type: String, trim: true }, // "7", "8", ... "12"
    section: { type: String, trim: true }, // "A", "B", "C", "D"
    previousInstitution: { type: String, trim: true },
    enrollmentType: { type: String, enum: ['nuevo', 'transferencia', 'reingreso', ''], default: '' },
    email: { type: String, trim: true },
    phone: { type: String, trim: true },
    representative: { type: representativeSchema, default: () => ({}) },
    studentPhotoUrl: { type: String, trim: true },
    representativePhotoUrl: { type: String, trim: true },
    paymentConfig: { type: paymentConfigRefSchema, default: () => ({}) },
    expedientUrl: { type: String },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

studentSchema.index({ idNumber: 1 }, { unique: true, sparse: true });
studentSchema.index({ grade: 1, section: 1 });
studentSchema.index({ firstName: 1, lastName: 1 });

const Student = mongoose.model('Student', studentSchema);
export default Student;
