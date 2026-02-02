import Receipt from '../models/Receipt.js';
import Payment from '../models/Payment.js';
import { getPublicPath } from '../config/upload.js';

export const create = async (req, res, next) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ ok: false, message: 'Imagen del comprobante requerida.' });
    }
    const url = getPublicPath(req, file) || `/uploads/receipts/${file.filename}`;
    const receipt = new Receipt({
      imageUrl: url,
      payments: req.body.paymentIds ? (Array.isArray(req.body.paymentIds) ? req.body.paymentIds : [req.body.paymentIds]) : [],
    });
    await receipt.save();
    if (receipt.payments.length) {
      await Payment.updateMany(
        { _id: { $in: receipt.payments } },
        { $set: { receipt: receipt._id } }
      );
    }
    res.status(201).json({ ok: true, data: receipt, message: 'Comprobante registrado.' });
  } catch (err) {
    next(err);
  }
};

export const getOne = async (req, res, next) => {
  try {
    const receipt = await Receipt.findById(req.params.id)
      .populate('payments')
      .lean();
    if (!receipt) {
      return res.status(404).json({ ok: false, message: 'Comprobante no encontrado.' });
    }
    res.json({ ok: true, data: receipt });
  } catch (err) {
    next(err);
  }
};
