import mongoose from 'mongoose';

/**
 * Pago: monto (Bs, USD, tasa), método, fecha, corte, exoneración, estudiante, comprobante.
 */
const paymentSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    cutOffDate: { type: mongoose.Schema.Types.ObjectId, ref: 'CutOffDate', required: true },
    amountBs: { type: Number, default: 0 },
    amountUsd: { type: Number, default: 0 },
    exchangeRate: { type: Number },
    paymentMethod: { type: String, trim: true }, // efectivo, transferencia, punto de venta, etc.
    paidAt: { type: Date, default: Date.now },
    receipt: { type: mongoose.Schema.Types.ObjectId, ref: 'Receipt' },
    exemption: {
      amountExonerated: { type: Number, default: 0 },
      amountPending: { type: Number, default: 0 },
    },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

paymentSchema.index({ student: 1, cutOffDate: 1 });

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
