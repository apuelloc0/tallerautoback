import mongoose from 'mongoose';

/**
 * Notas por año, por estudiante, todas las asignaturas, 3 cortes, 1 nota por corte.
 */
const gradeSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    year: { type: Number, required: true },
    subject: { type: String, required: true, trim: true },
    corte1: { type: Number, min: 0, max: 20 },
    corte2: { type: Number, min: 0, max: 20 },
    corte3: { type: Number, min: 0, max: 20 },
    average: { type: Number, min: 0, max: 20 },
  },
  { timestamps: true }
);

gradeSchema.index({ student: 1, year: 1, subject: 1 }, { unique: true });

function computeAverage(corte1, corte2, corte3) {
  const c = [corte1, corte2, corte3].filter((n) => n != null && !Number.isNaN(n));
  return c.length ? c.reduce((a, b) => a + b, 0) / c.length : undefined;
}

gradeSchema.pre('save', function (next) {
  const avg = computeAverage(this.corte1, this.corte2, this.corte3);
  if (avg !== undefined) this.average = avg;
  next();
});


const Grade = mongoose.model('Grade', gradeSchema);
export default Grade;
