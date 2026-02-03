import mongoose from 'mongoose';

/**
 * Pago: monto (Bs, USD, tasa), método, fecha, corte, exoneración, estudiante, comprobante.
 */
const paymentSchema = new mongoose.Schema(
  {
    estudiante: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    fechaCorte: { type: mongoose.Schema.Types.ObjectId, ref: 'CutOffDate', required: true },
    montoBs: { type: Number, default: 0 },
    montoUsd: { type: Number, default: 0 },
    metodoPago: { type: String, trim: true }, // efectivo, transferencia, punto de venta, etc.
    fechaPago: { type: Date, default: Date.now },
    recibo: { type: mongoose.Schema.Types.ObjectId, ref: 'Receipt' },
    exoneracion: {
      montoExonerado: { type: Number, default: 0 },
      montoPendiente: { type: Number, default: 0 },
    },
    notas: { type: String, trim: true },
  },
  { timestamps: true }
);

paymentSchema.index({ student: 1, cutOffDate: 1 });

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
