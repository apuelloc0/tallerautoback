import Student from '../models/Student.js';
import Payment from '../models/Payment.js';
import Grade from '../models/Grade.js';
import CutOffDate from '../models/CutOffDate.js';

/** Reporte institucional: resumen general */
export const institutional = async (req, res, next) => {
  try {
    const [studentCount, paymentCount, paymentTotal, gradeCount, cutOffCount] = await Promise.all([
      Student.countDocuments({ active: true }),
      Payment.countDocuments(),
      Payment.aggregate([{ $group: { _id: null, bs: { $sum: '$amountBs' }, usd: { $sum: '$amountUsd' } } }]),
      Grade.countDocuments(),
      CutOffDate.countDocuments({ active: true }),
    ]);
    const byYearSection = await Student.aggregate([
      { $match: { active: true } },
      { $group: { _id: { year: '$year', section: '$section' }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.section': 1 } },
    ]);
    const totals = paymentTotal[0] || { bs: 0, usd: 0 };
    res.json({
      ok: true,
      data: {
        students: { total: studentCount, byYearSection },
        payments: { total: paymentCount, totalBs: totals.bs, totalUsd: totals.usd },
        grades: gradeCount,
        cutOffDates: cutOffCount,
      },
    });
  } catch (err) {
    next(err);
  }
};
