import mongoose from 'mongoose';

/**
 * Comprobante: URL de imagen y pagos relacionados (varios).
 */
const receiptSchema = new mongoose.Schema(
  {
    imageUrl: { type: String, required: true },
    payments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Payment' }],
  },
  { timestamps: true }
);

const Receipt = mongoose.model('Receipt', receiptSchema);
export default Receipt;
