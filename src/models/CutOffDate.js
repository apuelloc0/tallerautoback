import mongoose from 'mongoose';

/**
 * Registro de fechas de corte: monto ($) y fecha límite.
 */
const cutOffDateSchema = new mongoose.Schema(
  {
    period: { type: String, required: true, trim: true },
    amountUsd: { type: Number, default: 0 },
    amountBs: { type: Number, default: 0 },
    dueDate: { type: Date, required: true },
    description: { type: String, trim: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const CutOffDate = mongoose.model('CutOffDate', cutOffDateSchema);
export default CutOffDate;
