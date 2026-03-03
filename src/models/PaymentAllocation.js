import mongoose from 'mongoose';

/**
 * Aplicación de parte de una transacción (Payment) a un estudiante y una fecha de corte.
 * Un pago (transacción) puede tener varias allocations (varios alumnos y/o varios cortes).
 */
const paymentAllocationSchema = new mongoose.Schema(
  {
    payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    cutOffDate: { type: mongoose.Schema.Types.ObjectId, ref: 'CutOffDate', required: true },
    amountUsd: { type: Number, default: 0 },
    amountBs: { type: Number, default: 0 },
  },
  { timestamps: true }
);

paymentAllocationSchema.index({ payment: 1 });
paymentAllocationSchema.index({ student: 1, cutOffDate: 1 });

const PaymentAllocation = mongoose.model('PaymentAllocation', paymentAllocationSchema);
export default PaymentAllocation;
