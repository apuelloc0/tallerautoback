import mongoose from 'mongoose';

/**
 * Registro de fechas de corte: monto ($) y fecha límite.
 */
const cutOffDateSchema = new mongoose.Schema(
  {
    config: { type: mongoose.Schema.Types.ObjectId, ref: 'PaymentConfig', required: true },
    period: { type: String, trim: true }, // ej. "2025-01" para enero 2025
    montoUsd: { type: Number, default: 0 },
    fechaCorte: { type: Date, required: true },
    activo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

cutOffDateSchema.index({ config: 1, fechaCorte: 1 });
cutOffDateSchema.index({ activo: 1 });

const CutOffDate = mongoose.model('CutOffDate', cutOffDateSchema);
export default CutOffDate;
