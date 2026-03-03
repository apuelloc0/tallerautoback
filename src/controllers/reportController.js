import Student from '../models/Student.js';
import Payment from '../models/Payment.js';
import CutOffDate from '../models/CutOffDate.js';
import AcademicConfig from '../models/AcademicConfig.js';
import Grade from '../models/Grade.js';
import User from '../models/User.js';
import PDFDocument from 'pdfkit';

/** Reporte institucional: resumen general. JSON o PDF (format=pdf). */
export const institutional = async (req, res, next) => {
  try {
    const { format } = req.query;
    const [studentCount, paymentCount, paymentTotal, gradeCount, cutOffCount] = await Promise.all([
      Student.countDocuments({ active: true }),
      Payment.countDocuments(),
      Payment.aggregate([{ $group: { _id: null, bs: { $sum: '$amountBs' }, usd: { $sum: '$amountUsd' } } }]),
      Grade.countDocuments(),
      CutOffDate.countDocuments({ activo: true }),
    ]);
    const byYearSection = await Student.aggregate([
      { $match: { active: true } },
      { $group: { _id: { grado: '$grade', seccion: '$section' }, count: { $sum: 1 } } },
      { $sort: { '_id.grado': 1, '_id.seccion': 1 } },
    ]);
    const totals = paymentTotal[0] || { bs: 0, usd: 0 };
    const data = {
      students: { total: studentCount, byYearSection },
      payments: { total: paymentCount, totalBs: totals.bs, totalUsd: totals.usd },
      grades: gradeCount,
      cutOffDates: cutOffCount,
    };
    if (format === 'pdf') return sendInstitutionalPdf(res, data);
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
};

/** Ocupación y capacidad. JSON o PDF. */
export const occupancy = async (req, res, next) => {
  try {
    const { format } = req.query;
    const academicConfig = await AcademicConfig.findOne().lean();
    const capacity = Number(academicConfig?.capacidadMaxima) || 0;
    const totalStudents = await Student.countDocuments({ active: { $ne: false } });
    const cuposDisponibles = Math.max(0, capacity - totalStudents);
    const ocupacionPorcentaje = capacity > 0 ? Math.round((totalStudents / capacity) * 100) : 0;
    const data = {
      capacidadMaxima: capacity,
      totalEstudiantes: totalStudents,
      cuposDisponibles,
      ocupacionPorcentaje,
    };
    if (format === 'pdf') return sendOccupancyPdf(res, data);
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
};

/** Matrícula por grado y sección. JSON o PDF. */
export const enrollmentByGradeSection = async (req, res, next) => {
  try {
    const { format } = req.query;
    const agg = await Student.aggregate([
      { $match: { active: { $ne: false } } },
      { $group: { _id: { grado: '$grade', seccion: '$section' }, count: { $sum: 1 } } },
      { $sort: { '_id.grade': 1, '_id.section': 1 } },
    ]);
    const rows = agg.map((a) => ({
      grado: a._id.grado || '—',
      seccion: a._id.seccion || '—',
      cantidad: a.count,
    }));
    const total = rows.reduce((s, x) => s + x.cantidad, 0);
    const data = { rows, total };
    if (format === 'pdf') return sendEnrollmentPdf(res, data);
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
};

/** Usuarios y roles. JSON o PDF. */
export const usersRoles = async (req, res, next) => {
  try {
    const { format } = req.query;
    const users = await User.find({}).select('username fullName role active').sort({ role: 1, username: 1 }).lean();
    const data = users.map((u) => ({
      usuario: u.username,
      nombreCompleto: u.fullName,
      rol: u.role,
      activo: u.active !== false,
    }));
    if (format === 'pdf') return sendUsersRolesPdf(res, data);
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
};

// ========== HELPERS PDF ==========

function setPdfHeaders(res, filename) {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
}

function sendInstitutionalPdf(res, data) {
  setPdfHeaders(res, `reporte-institucional-${new Date().toISOString().slice(0, 10)}.pdf`);
  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(res);
  doc.fontSize(16).text('Reporte institucional', { align: 'center' });
  doc.fontSize(10).text(new Date().toLocaleString('es'), { align: 'center' });
  doc.moveDown(1);
  const st = data.students || {};
  const pay = data.payments || {};
  doc.fontSize(11).text(`Estudiantes total: ${st.total}`, { continued: false });
  doc.text(`Pagos (registros): ${pay.total}  —  Total Bs: ${pay.totalBs ?? 0}  —  Total USD: ${pay.totalUsd ?? 0}`, { continued: false });
  doc.text(`Notas registradas: ${data.grades ?? 0}  —  Fechas de corte activas: ${data.cutOffDates ?? 0}`, { continued: false });
  doc.moveDown(0.5);
  doc.fontSize(10).text('Por grado y sección', { continued: false });
  doc.moveDown(0.3);
  let y = doc.y;
  doc.font('Helvetica-Bold').fontSize(9);
  doc.text('Grado', 50, y); doc.text('Sección', 120, y); doc.text('Cantidad', 200, y);
  y += 14;
  doc.moveTo(50, y).lineTo(250, y).stroke();
  y += 6;
  doc.font('Helvetica').fontSize(9);
  (st.byYearSection || []).forEach((r) => {
    doc.text(String(r._id?.grado ?? '—'), 50, y);
    doc.text(String(r._id?.seccion ?? '—'), 120, y);
    doc.text(String(r.count ?? 0), 200, y);
    y += 12;
  });
  doc.end();
}

function sendOccupancyPdf(res, data) {
  setPdfHeaders(res, `reporte-ocupacion-${new Date().toISOString().slice(0, 10)}.pdf`);
  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(res);
  doc.fontSize(16).text('Ocupación y capacidad', { align: 'center' });
  doc.fontSize(10).text(new Date().toLocaleString('es'), { align: 'center' });
  doc.moveDown(1.5);
  doc.fontSize(11);
  doc.text(`Capacidad máxima: ${data.capacidadMaxima}`, { continued: false });
  doc.text(`Total estudiantes: ${data.totalEstudiantes}`, { continued: false });
  doc.text(`Cupos disponibles: ${data.cuposDisponibles}`, { continued: false });
  doc.text(`Ocupación: ${data.ocupacionPorcentaje}%`, { continued: false });
  doc.end();
}

function sendEnrollmentPdf(res, data) {
  setPdfHeaders(res, `reporte-matricula-${new Date().toISOString().slice(0, 10)}.pdf`);
  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(res);
  doc.fontSize(16).text('Matrícula por grado y sección', { align: 'center' });
  doc.fontSize(10).text(`Total: ${data.total} estudiantes — ${new Date().toLocaleString('es')}`, { align: 'center' });
  doc.moveDown(1);
  let y = doc.y;
  doc.font('Helvetica-Bold').fontSize(10);
  doc.text('Grado', 50, y); doc.text('Sección', 120, y); doc.text('Cantidad', 200, y);
  y += 14;
  doc.moveTo(50, y).lineTo(250, y).stroke();
  y += 6;
  doc.font('Helvetica').fontSize(10);
  (data.rows || []).forEach((r) => {
    doc.text(String(r.grado), 50, y);
    doc.text(String(r.seccion), 120, y);
    doc.text(String(r.cantidad), 200, y);
    y += 12;
  });
  doc.end();
}

function sendUsersRolesPdf(res, data) {
  setPdfHeaders(res, `reporte-usuarios-roles-${new Date().toISOString().slice(0, 10)}.pdf`);
  const doc = new PDFDocument({ margin: 50, size: 'A4', layout: 'landscape' });
  doc.pipe(res);
  doc.fontSize(16).text('Usuarios y roles', { align: 'center' });
  doc.fontSize(10).text(new Date().toLocaleString('es'), { align: 'center' });
  doc.moveDown(1);
  const w = [120, 180, 100, 60];
  let y = doc.y;
  doc.font('Helvetica-Bold').fontSize(9);
  doc.text('Usuario', 50, y, { width: w[0] });
  doc.text('Nombre completo', 170, y, { width: w[1] });
  doc.text('Rol', 350, y, { width: w[2] });
  doc.text('Activo', 450, y, { width: w[3] });
  y += 14;
  doc.moveTo(50, y).lineTo(doc.page.width - 50, y).stroke();
  y += 6;
  doc.font('Helvetica').fontSize(9);
  data.forEach((r) => {
    doc.text(String(r.usuario ?? '—').slice(0, 25), 50, y, { width: w[0] });
    doc.text(String(r.nombreCompleto ?? '—').slice(0, 35), 170, y, { width: w[1] });
    doc.text(String(r.rol ?? '—'), 350, y, { width: w[2] });
    doc.text(r.activo ? 'Sí' : 'No', 450, y, { width: w[3] });
    y += 12;
  });
  doc.end();
}
