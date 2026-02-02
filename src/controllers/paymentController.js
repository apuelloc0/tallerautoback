import Payment from '../models/Payment.js';
import CutOffDate from '../models/CutOffDate.js';
import PaymentConfig from '../models/PaymentConfig.js';
import Student from '../models/Student.js';
import Receipt from '../models/Receipt.js';
import mongoose from 'mongoose';

/** Configuración de periodo y monto */
export const listConfig = async (req, res, next) => {
  try {
    const configs = await PaymentConfig.find({ active: true }).sort({ period: -1 });
    res.json({ ok: true, data: configs });
  } catch (err) {
    next(err);
  }
};

export const createConfig = async (req, res, next) => {
  try {
    const config = new PaymentConfig(req.body);
    await config.save();
    res.status(201).json({ ok: true, data: config, message: 'Configuración creada.' });
  } catch (err) {
    next(err);
  }
};

export const updateConfig = async (req, res, next) => {
  try {
    const config = await PaymentConfig.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    if (!config) return res.status(404).json({ ok: false, message: 'Configuración no encontrada.' });
    res.json({ ok: true, data: config, message: 'Configuración actualizada.' });
  } catch (err) {
    next(err);
  }
};

/** Fechas de corte */
export const listCutOff = async (req, res, next) => {
  try {
    const { period } = req.query;
    const filter = period ? { period } : {};
    const list = await CutOffDate.find({ ...filter, active: true }).sort({ dueDate: 1 });
    res.json({ ok: true, data: list });
  } catch (err) {
    next(err);
  }
};

export const createCutOff = async (req, res, next) => {
  try {
    const cut = new CutOffDate(req.body);
    await cut.save();
    res.status(201).json({ ok: true, data: cut, message: 'Fecha de corte registrada.' });
  } catch (err) {
    next(err);
  }
};

export const updateCutOff = async (req, res, next) => {
  try {
    const cut = await CutOffDate.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    if (!cut) return res.status(404).json({ ok: false, message: 'Fecha de corte no encontrada.' });
    res.json({ ok: true, data: cut });
  } catch (err) {
    next(err);
  }
};

/** Registro de pagos */
export const listPayments = async (req, res, next) => {
  try {
    const { studentId, cutOffId, from, to } = req.query;
    const filter = {};
    if (studentId) filter.student = studentId;
    if (cutOffId) filter.cutOffDate = cutOffId;
    if (from || to) {
      filter.paidAt = {};
      if (from) filter.paidAt.$gte = new Date(from);
      if (to) filter.paidAt.$lte = new Date(to);
    }
    const payments = await Payment.find(filter)
      .populate('student', 'name ci year section')
      .populate('cutOffDate')
      .populate('receipt')
      .sort({ paidAt: -1 })
      .lean();
    res.json({ ok: true, data: payments });
  } catch (err) {
    next(err);
  }
};

export const createPayment = async (req, res, next) => {
  try {
    const payment = new Payment(req.body);
    await payment.save();
    const populated = await Payment.findById(payment._id)
      .populate('student', 'name ci year section')
      .populate('cutOffDate')
      .populate('receipt')
      .lean();
    res.status(201).json({ ok: true, data: populated, message: 'Pago registrado.' });
  } catch (err) {
    next(err);
  }
};

export const updatePayment = async (req, res, next) => {
  try {
    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    )
      .populate('student', 'name ci year section')
      .populate('cutOffDate')
      .populate('receipt')
      .lean();
    if (!payment) return res.status(404).json({ ok: false, message: 'Pago no encontrado.' });
    res.json({ ok: true, data: payment });
  } catch (err) {
    next(err);
  }
};

/** Historial por estudiante + info general (monto total, número de pagos) */
export const paymentHistoryByStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payments = await Payment.find({ student: id })
      .populate('cutOffDate')
      .populate('receipt')
      .sort({ paidAt: -1 })
      .lean();
    const totalBs = payments.reduce((a, p) => a + (p.amountBs || 0), 0);
    const totalUsd = payments.reduce((a, p) => a + (p.amountUsd || 0), 0);
    res.json({
      ok: true,
      data: {
        payments,
        summary: { totalPayments: payments.length, totalBs, totalUsd },
      },
    });
  } catch (err) {
    next(err);
  }
};

export const paymentSummary = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const match = {};
    if (from || to) {
      match.paidAt = {};
      if (from) match.paidAt.$gte = new Date(from);
      if (to) match.paidAt.$lte = new Date(to);
    }
    const [count, totalBs, totalUsd] = await Promise.all([
      Payment.countDocuments(match),
      Payment.aggregate([{ $match: match }, { $group: { _id: null, sum: { $sum: '$amountBs' } } }]),
      Payment.aggregate([{ $match: match }, { $group: { _id: null, sum: { $sum: '$amountUsd' } } }]),
    ]);
    res.json({
      ok: true,
      data: {
        totalPayments: count,
        totalBs: totalBs[0]?.sum ?? 0,
        totalUsd: totalUsd[0]?.sum ?? 0,
      },
    });
  } catch (err) {
    next(err);
  }
};

/** Solvencias: lista de estudiantes que deben según su configuración y cortes */
export const solvencies = async (req, res, next) => {
  try {
    const { period } = req.query;
    const cutOffs = await CutOffDate.find({ active: true, ...(period && { period }) }).lean();
    const cutOffIds = cutOffs.map((c) => c._id);
    const paidStudentCut = await Payment.find(
      { cutOffDate: { $in: cutOffIds } },
      { student: 1, cutOffDate: 1 }
    ).lean();
    const paidSet = new Set(paidStudentCut.map((p) => `${p.student}-${p.cutOffDate}`));
    const students = await Student.find({ active: true }).lean();
    const debtors = [];
    for (const s of students) {
      if (s.paymentConfig?.exoneracion?.type === 'permanente') continue;
      for (const cut of cutOffs) {
        const key = `${s._id}-${cut._id}`;
        if (!paidSet.has(key)) {
          debtors.push({
            student: s,
            cutOff: cut,
            studentId: s._id,
            cutOffId: cut._id,
          });
        }
      }
    }
    res.json({ ok: true, data: debtors });
  } catch (err) {
    next(err);
  }
};
