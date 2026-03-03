import mongoose from 'mongoose';

/**
 * Transacción de cobro: monto total recibido, fecha, forma de pago.
 * No tiene estudiante ni corte; las aplicaciones están en PaymentAllocation.
 * Un recibo puede agrupar una transacción; una transacción puede aplicarse a varios alumnos/cortes.
 */
const paymentSchema = new mongoose.Schema(
  {
    paymentType: { type: String, enum: ['usd', 'ves'], default: 'usd' },
    paymentMethod: { type: String, trim: true },
    amount: { type: Number, default: 0 },
    amountUsd: { type: Number, default: 0 },
    amountBs: { type: Number, default: 0 },
    paidAt: { type: Date, default: Date.now },
    description: { type: String, trim: true },
    receipt: { type: mongoose.Schema.Types.ObjectId, ref: 'Receipt' },
    referenceNumber: { type: String, trim: true, default: '' },
    supportImageUrl: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

paymentSchema.index({ paidAt: -1 });

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
