import mongoose from 'mongoose';

/**
 * Documentos del estudiante: C.I, notas (PDFs), etc.
 */
const documentSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    type: { type: String, required: true, trim: true }, // ci, notas, otro
    fileUrl: { type: String, required: true },
    originalName: { type: String, trim: true },
    description: { type: String, trim: true },
  },
  { timestamps: true }
);

documentSchema.index({ student: 1, type: 1 });

const Document = mongoose.model('Document', documentSchema);
export default Document;
