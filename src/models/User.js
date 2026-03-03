import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLES } from '../config/constants.js';

const securityQuestionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true }, // almacenar hasheado en producción
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    fullName: { type: String, trim: true },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.SECRETARIA,
    },
    active: { type: Boolean, default: true },
    securityQuestions: {
      type: [securityQuestionSchema],
      default: [],
      validate: {
        validator(v) {
          return !v.length || v.length >= 2;
        },
        message: 'Se requieren al menos 2 preguntas de seguridad para recuperación.',
      },
    },
    resetToken: { type: String, default: null },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  if (obj.securityQuestions) {
    obj.securityQuestions = obj.securityQuestions.map((q, i) => ({
      question: q.question,
      index: i,
    }));
  }
  return obj;
};

const User = mongoose.model('User', userSchema);
export default User;
