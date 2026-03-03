import AcademicConfig from '../models/AcademicConfig.js';
import Student from '../models/Student.js';
import CutOffDate from '../models/CutOffDate.js';
import PaymentAllocation from '../models/PaymentAllocation.js';

/** Monto esperado por alumno y corte (misma lógica que paymentController) */
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

/** GET /api/dashboard - Estadísticas para el panel de inicio */
export const getStats = async (req, res, next) => {
  try {
    const [totalStudents, academicConfig, cutOffs, allocations, students] = await Promise.all([
      Student.countDocuments({ active: { $ne: false } }),
      AcademicConfig.findOne().lean(),
      CutOffDate.find({ activo: true }).sort({ fechaCorte: 1 }).lean(),
      PaymentAllocation.find({}).lean(),
      Student.find({ active: { $ne: false } }).lean(),
    ]);

    const capacity = academicConfig?.capacidadMaxima != null ? Number(academicConfig.capacidadMaxima) : 0;
    const grados = academicConfig?.grados || [];
    const classrooms = grados.length;

    // Solo cortes vencidos (fecha de corte ya pasada) definen morosidad
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const cutOffsVencidos = cutOffs.filter((c) => new Date(c.fechaCorte) < startOfToday);

    const paidByStudentCut = {};
    allocations.forEach((a) => {
      const k = `${a.student}-${a.cutOffDate}`;
      if (!paidByStudentCut[k]) paidByStudentCut[k] = 0;
      paidByStudentCut[k] += a.amountUsd || 0;
    });

    // Moroso = tiene al menos un corte vencido sin pagar. Solvente = todos los cortes vencidos pagados.
    const morosoStudentIds = new Set();
    for (const s of students) {
      if (s.paymentConfig?.exemption?.type === 'permanente') continue;
      for (const cut of cutOffsVencidos) {
        const expected = getExpectedAmount(s, cut);
        if (expected <= 0) continue;
        const key = `${s._id}-${cut._id}`;
        const paid = paidByStudentCut[key] || 0;
        const pending = Math.max(0, expected - paid);
        if (pending > 0) {
          morosoStudentIds.add(String(s._id));
          break;
        }
      }
    }

    const morosos = morosoStudentIds.size;
    const solventes = Math.max(0, totalStudents - morosos);
    const cuposDisponibles = Math.max(0, capacity - totalStudents);

    res.json({
      ok: true,
      data: {
        totalStudents,
        solventes,
        morosos,
        cuposDisponibles,
        classrooms,
        capacity,
      },
    });
  } catch (err) {
    next(err);
  }
};
