import mongoose from 'mongoose';

/**
 * Configuración global de periodo y monto de pago.
 * Un periodo puede ser por ejemplo "2025-01" (enero 2025) o "2024-2025" (año escolar).
 */
const paymentConfigSchema = new mongoose.Schema(
  {
    // Tipo de configuración
    tipo: { type: String, enum: ['anual', 'mensual', 'quincenal', 'semanal'], default: null },
    // Fecha de inicio
    fechaInicio: { type: Date, required: true },
    // Fecha de fin
    fechaFin: { type: Date, required: true },
    // Periodo escolar
    periodoEscolar: { type: String, required: true, trim: true },
    // Monto en USD
    montoUsd: { type: Number, default: 0 },
    // Activo
    activo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const PaymentConfig = mongoose.model('PaymentConfig', paymentConfigSchema);
export default PaymentConfig;
