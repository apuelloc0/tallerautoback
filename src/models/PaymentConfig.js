import mongoose from 'mongoose';

/**
 * Configuración global de periodo y monto de pago.
 * Un periodo puede ser por ejemplo "2025-01" (enero 2025) o "2024-2025" (año escolar).
 */
const paymentConfigSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    period: { type: String, required: true, trim: true }, // ej: "2025-01", "2024-2025"
    amountBs: { type: Number, default: 0 },
    amountUsd: { type: Number, default: 0 },
    exchangeRate: { type: Number }, // tasa Bs/$ si aplica
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const PaymentConfig = mongoose.model('PaymentConfig', paymentConfigSchema);
export default PaymentConfig;
