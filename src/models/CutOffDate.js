import mongoose from 'mongoose';

/**
 * Registro de fechas de corte: monto ($) y fecha límite.
 */
const cutOffDateSchema = new mongoose.Schema(
  {
    // Periodo de pago
    config: { type: mongoose.Schema.Types.ObjectId, ref: 'PaymentConfig', required: true },
    montoUsd: { type: Number, default: 0 },
    fechaCorte: { type: Date, required: true },
    activo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const CutOffDate = mongoose.model('CutOffDate', cutOffDateSchema);
export default CutOffDate;
