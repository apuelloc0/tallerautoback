import mongoose from 'mongoose';

/**
 * Registro de respaldos realizados.
 */
const backupSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    path: { type: String },
    size: { type: Number },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const Backup = mongoose.model('Backup', backupSchema);
export default Backup;
