import mongoose from 'mongoose';

/**
 * Pago: estudiante, tipo (USD/VES), monto, forma de pago, fecha, meses cancelados, descripción.
 * cutOffDate opcional (para vincular con cortes de solvencia).
 */
const paymentSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    cutOffDate: { type: mongoose.Schema.Types.ObjectId, ref: 'CutOffDate', default: null },
    paymentType: { type: String, enum: ['usd', 'ves'], trim: true }, // dolares/bolivares por compatibilidad con front
    paymentMethod: { type: String, trim: true }, // PagoMovil, Efectivo, Transferencia, etc.
    amount: { type: Number, default: 0 }, // Monto principal en la moneda de paymentType
    amountUsd: { type: Number, default: 0 },
    amountBs: { type: Number, default: 0 },
    paidAt: { type: Date, default: Date.now },
    description: { type: String, trim: true },
    receipt: { type: mongoose.Schema.Types.ObjectId, ref: 'Receipt' },
    exemption: {
      amountExonerated: { type: Number, default: 0 },
      amountPending: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

paymentSchema.index({ student: 1, cutOffDate: 1 });
paymentSchema.index({ paidAt: -1 });

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
