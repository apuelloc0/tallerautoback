import Payment from '../models/Payment.js';
import PaymentAllocation from '../models/PaymentAllocation.js';
import CutOffDate from '../models/CutOffDate.js';
import PaymentConfig from '../models/PaymentConfig.js';
import Student from '../models/Student.js';
import Receipt from '../models/Receipt.js';
import mongoose from 'mongoose';

const studentSelect = 'firstName lastName idNumber grade section';

/** Monto esperado por alumno y corte (considera beca total, parcial y exoneración) */
function getExpectedAmount(student, cutOff) {
  const pc = student.paymentConfig || {};
  if (pc.hasFullScholarship) return 0;
  const ex = pc.exemption || {};
  if (ex.type === 'permanente') return 0;
  if (ex.type === 'temporal' && ex.until && new Date(cutOff.fechaCorte) <= new Date(ex.until)) return 0;
  let base = Number(cutOff.montoUsd) || 0;
  if (pc.hasDiscount) {
    if (pc.discountPercentage != null) base = base * (1 - pc.discountPercentage / 100);
    if (pc.discountAmountUsd != null) base = Math.max(0, base - pc.discountAmountUsd);
  }
  return Math.max(0, base);
}

/** Configuración de periodo y monto */
export const listConfig = async (req, res, next) => {
  try {
    const configs = await PaymentConfig.find({ activo: true }).sort({ fechaInicio: -1 }).lean();
    res.json({ ok: true, data: configs });
  } catch (err) {
    next(err);
  }
};

export const createConfig = async (req, res, next) => {
  try {
    const { periodoEscolar, tipo, fechaInicio, fechaFin, montoUsd, activo } = req.body;
    const config = new PaymentConfig({
      periodoEscolar: periodoEscolar || req.body.period,
      tipo,
      fechaInicio: new Date(fechaInicio),
      fechaFin: new Date(fechaFin),
      montoUsd: montoUsd != null ? Number(montoUsd) : 0,
      activo: activo !== false,
    });
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
    const { config: configId, activo: activoQuery } = req.query;
    const filter = { activo: true };
    if (configId) filter.config = configId;
    if (activoQuery !== undefined) filter.activo = activoQuery === 'true';
    const list = await CutOffDate.find(filter).populate('config').sort({ fechaCorte: 1 }).lean();
    res.json({ ok: true, data: list });
  } catch (err) {
    next(err);
  }
};

export const createCutOff = async (req, res, next) => {
  try {
    const { config, period, fechaCorte, montoUsd, activo } = req.body;
    const cut = new CutOffDate({
      config,
      period: period || null,
      fechaCorte: new Date(fechaCorte),
      montoUsd: montoUsd != null ? Number(montoUsd) : 0,
      activo: activo !== false,
    });
    await cut.save();
    const populated = await CutOffDate.findById(cut._id).populate('config').lean();
    res.status(201).json({ ok: true, data: populated, message: 'Fecha de corte registrada.' });
  } catch (err) {
    next(err);
  }
};

export const updateCutOff = async (req, res, next) => {
  try {
    const cut = await CutOffDate.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true }).populate('config').lean();
    if (!cut) return res.status(404).json({ ok: false, message: 'Fecha de corte no encontrada.' });
    res.json({ ok: true, data: cut });
  } catch (err) {
    next(err);
  }
};

/** Listar transacciones (pagos) con sus allocations */
export const listPayments = async (req, res, next) => {
  try {
    const { studentId, cutOffId, from, to } = req.query;
    let filter = {};
    if (from || to) {
      filter.paidAt = {};
      if (from) filter.paidAt.$gte = new Date(from);
      if (to) filter.paidAt.$lte = new Date(to);
    }
    let payments = await Payment.find(filter).populate('receipt').sort({ paidAt: -1 }).lean();
    const paymentIds = payments.map((p) => p._id);
    let allocationFilter = { payment: { $in: paymentIds } };
    if (studentId) allocationFilter.student = studentId;
    if (cutOffId) allocationFilter.cutOffDate = cutOffId;
    const allocations = await PaymentAllocation.find(allocationFilter)
      .populate('student', studentSelect)
      .populate('cutOffDate')
      .lean();
    const byPayment = {};
    allocations.forEach((a) => {
      if (!byPayment[a.payment]) byPayment[a.payment] = [];
      byPayment[a.payment].push(a);
    });
    if (studentId || cutOffId) {
      const relevantPaymentIds = new Set(allocations.map((a) => String(a.payment)));
      payments = payments.filter((p) => relevantPaymentIds.has(String(p._id)));
    }
    const data = payments.map((p) => ({ ...p, allocations: byPayment[p._id] || [] }));
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
};

/** Normalizar body: transacción + allocations */
function normalizePaymentBody(body) {
  const paymentType = (body.paymentType || 'usd').toLowerCase();
  const isUsd = paymentType === 'usd';
  const amount = Number(body.amount) || Number(body.amountUsd) || Number(body.amountBs) || 0;
  const amountUsd = body.amountUsd != null ? Number(body.amountUsd) : isUsd ? amount : 0;
  const amountBs = body.amountBs != null ? Number(body.amountBs) : !isUsd ? amount : 0;
  const paidAt = body.paidAt || body.fechaPago ? new Date(body.paidAt || body.fechaPago) : new Date();
  return {
    paymentType: isUsd ? 'usd' : 'ves',
    paymentMethod: body.paymentMethod || body.formaPago || '',
    amount: amountUsd || amountBs || amount,
    amountUsd,
    amountBs,
    paidAt,
    description: (body.description || body.descripcion || '').trim(),
    receipt: body.receipt || null,
    allocations: Array.isArray(body.allocations) ? body.allocations : [],
  };
}

/** Crear transacción + allocations. Valida que suma de allocations no supere el total. */
export const createPayment = async (req, res, next) => {
  try {
    const data = normalizePaymentBody(req.body);
    const totalUsd = data.allocations.reduce((s, a) => s + (Number(a.amountUsd) || 0), 0);
    const totalBs = data.allocations.reduce((s, a) => s + (Number(a.amountBs) || 0), 0);
    if (data.amountUsd > 0 && totalUsd > data.amountUsd) {
      return res.status(400).json({ ok: false, message: 'La suma de montos USD en las líneas supera el total de la transacción.' });
    }
    if (data.amountBs > 0 && totalBs > data.amountBs) {
      return res.status(400).json({ ok: false, message: 'La suma de montos Bs en las líneas supera el total de la transacción.' });
    }
    const payment = new Payment({
      paymentType: data.paymentType,
      paymentMethod: data.paymentMethod,
      amount: data.amount,
      amountUsd: data.amountUsd,
      amountBs: data.amountBs,
      paidAt: data.paidAt,
      description: data.description,
      receipt: data.receipt,
    });
    await payment.save();
    const allocDocs = data.allocations
      .filter((a) => a.student && a.cutOffDate && ((Number(a.amountUsd) || 0) > 0 || (Number(a.amountBs) || 0) > 0))
      .map((a) => ({
        payment: payment._id,
        student: a.student,
        cutOffDate: a.cutOffDate,
        amountUsd: Number(a.amountUsd) || 0,
        amountBs: Number(a.amountBs) || 0,
      }));
    if (allocDocs.length) await PaymentAllocation.insertMany(allocDocs);
    const allocations = await PaymentAllocation.find({ payment: payment._id })
      .populate('student', studentSelect)
      .populate('cutOffDate')
      .lean();
    const result = { ...payment.toObject(), allocations };
    res.status(201).json({ ok: true, data: result, message: 'Pago registrado.' });
  } catch (err) {
    next(err);
  }
};

export const updatePayment = async (req, res, next) => {
  try {
    const payment = await Payment.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true }).populate('receipt').lean();
    if (!payment) return res.status(404).json({ ok: false, message: 'Pago no encontrado.' });
    const allocations = await PaymentAllocation.find({ payment: payment._id })
      .populate('student', studentSelect)
      .populate('cutOffDate')
      .lean();
    res.json({ ok: true, data: { ...payment, allocations } });
  } catch (err) {
    next(err);
  }
};

/** Cortes pendientes por estudiante (con monto esperado y ya pagado) */
export const studentPendingCutOffs = async (req, res, next) => {
  try {
    const { id } = req.params;
    const student = await Student.findById(id).lean();
    if (!student) return res.status(404).json({ ok: false, message: 'Estudiante no encontrado.' });
    const cutOffs = await CutOffDate.find({ activo: true }).sort({ fechaCorte: 1 }).lean();
    const allocs = await PaymentAllocation.find({ student: id }).lean();
    const paidByCut = {};
    allocs.forEach((a) => {
      const k = String(a.cutOffDate);
      if (!paidByCut[k]) paidByCut[k] = { amountUsd: 0, amountBs: 0 };
      paidByCut[k].amountUsd += a.amountUsd || 0;
      paidByCut[k].amountBs += a.amountBs || 0;
    });
    const pending = cutOffs
      .map((cut) => {
        const expected = getExpectedAmount(student, cut);
        const paid = paidByCut[String(cut._id)] || { amountUsd: 0, amountBs: 0 };
        const pendingAmount = Math.max(0, expected - (paid.amountUsd || 0));
        return {
          cutOffDate: cut,
          cutOffId: cut._id,
          expectedAmountUsd: expected,
          paidAmountUsd: paid.amountUsd,
          paidAmountBs: paid.amountBs,
          pendingAmountUsd: pendingAmount,
          isPaid: pendingAmount <= 0,
        };
      })
      .filter((p) => p.pendingAmountUsd > 0);
    res.json({ ok: true, data: { student, pending } });
  } catch (err) {
    next(err);
  }
};

/** Historial por estudiante (allocations del estudiante con payment y cutOff) */
export const paymentHistoryByStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const allocations = await PaymentAllocation.find({ student: id })
      .populate('payment')
      .populate('cutOffDate')
      .sort({ createdAt: -1 })
      .lean();
    const totalUsd = allocations.reduce((a, b) => a + (b.amountUsd || 0), 0);
    const totalBs = allocations.reduce((a, b) => a + (b.amountBs || 0), 0);
    const paymentIds = [...new Set(allocations.map((a) => a.payment?._id).filter(Boolean))];
    const payments = await Payment.find({ _id: { $in: paymentIds } }).lean();
    res.json({
      ok: true,
      data: {
        allocations,
        payments,
        summary: { totalAllocations: allocations.length, totalUsd, totalBs },
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
    const [count, sumUsd, sumBs] = await Promise.all([
      Payment.countDocuments(match),
      Payment.aggregate([{ $match: match }, { $group: { _id: null, sum: { $sum: '$amountUsd' } } }]),
      Payment.aggregate([{ $match: match }, { $group: { _id: null, sum: { $sum: '$amountBs' } } }]),
    ]);
    res.json({
      ok: true,
      data: {
        totalPayments: count,
        totalUsd: sumUsd[0]?.sum ?? 0,
        totalBs: sumBs[0]?.sum ?? 0,
      },
    });
  } catch (err) {
    next(err);
  }
};

/** Solvencias: estudiantes con cortes vencidos no pagados (solo fechas de corte ya pasadas) */
export const solvencies = async (req, res, next) => {
  try {
    const { config: configId } = req.query;
    const cutFilter = { activo: true };
    if (configId) cutFilter.config = configId;
    const allCutOffs = await CutOffDate.find(cutFilter).sort({ fechaCorte: 1 }).lean();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const cutOffs = allCutOffs.filter((c) => new Date(c.fechaCorte) < startOfToday);
    const cutOffIds = cutOffs.map((c) => c._id);
    const allocs = await PaymentAllocation.find({ cutOffDate: { $in: cutOffIds } }).lean();
    const paidByStudentCut = {};
    allocs.forEach((a) => {
      const k = `${a.student}-${a.cutOffDate}`;
      if (!paidByStudentCut[k]) paidByStudentCut[k] = 0;
      paidByStudentCut[k] += a.amountUsd || 0;
    });
    const students = await Student.find({ active: true }).lean();
    const debtors = [];
    for (const s of students) {
      if (s.paymentConfig?.exemption?.type === 'permanente') continue;
      for (const cut of cutOffs) {
        const expected = getExpectedAmount(s, cut);
        if (expected <= 0) continue;
        const key = `${s._id}-${cut._id}`;
        const paid = paidByStudentCut[key] || 0;
        const pending = Math.max(0, expected - paid);
        if (pending > 0) {
          debtors.push({
            studentId: s._id,
            student: s,
            cutOffId: cut._id,
            cutOff: cut,
            expectedAmountUsd: expected,
            paidAmountUsd: paid,
            pendingAmountUsd: pending,
          });
        }
      }
    }
    res.json({ ok: true, data: debtors });
  } catch (err) {
    next(err);
  }
};
