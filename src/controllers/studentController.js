import Student from '../models/Student.js';
import Document from '../models/Document.js';
import { INSCRIPTION, SCHOOL_LEVEL } from '../config/constants.js';
import { assertGradeSectionAgainstConfig } from '../utils/academicPlacement.js';
import { getPublicPath } from '../config/upload.js';
import { loadInstitutionGeneral, drawReportHeader, drawGeneratedFooter, resolveLogoAbsolutePath } from '../utils/reportLayout.js';
import { computeStudentCardNumber } from '../utils/studentCard.js';
import PDFDocument from 'pdfkit';
import fs from 'fs';

export const list = async (req, res, next) => {
  try {
    const { year, section, grade, schoolLevel, enrollmentType, search } = req.query;
    const filter = { active: true };
    if (year) filter.grade = String(year);
    if (section) filter.section = section;
    if (grade) filter.grade = grade;
    if (schoolLevel) filter.schoolLevel = schoolLevel;
    if (enrollmentType) {
      const rev = { nuevo_ingreso: 'nuevo', transferencia: 'transferencia', reingreso: 'reingreso' };
      filter.enrollmentType = rev[enrollmentType] || enrollmentType;
    }
    if (search) {
      const term = new RegExp(search, 'i');
      filter.$or = [
        { idNumber: term },
        { firstName: term },
        { lastName: term },
      ];
    }
    const students = await Student.find(filter)
      .sort({ schoolLevel: 1, grade: 1, section: 1, firstName: 1, lastName: 1 })
      .lean();
    res.json({ ok: true, data: students });
  } catch (err) {
    next(err);
  }
};

export const getOne = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ ok: false, message: 'Estudiante no encontrado.' });
    }
    const docs = await Document.find({ student: student._id }).lean();
    res.json({ ok: true, data: { ...student.toObject(), documents: docs } });
  } catch (err) {
    next(err);
  }
};

const STUDENT_BODY_FIELDS = [
  'firstName', 'lastName', 'idNationality', 'idNumber', 'birthDate', 'gender',
  'address', 'birthPlace', 'enrollmentDate', 'schoolLevel', 'grade', 'section',
  'previousInstitution', 'enrollmentType', 'email', 'phone',
  'legalRepresentative', 'mother', 'father',
  'representative', 'representativeFirstName', 'representativeLastName',
  'representativeIdNationality', 'representativeIdNumber',
  'representativeRelationship', 'representativeProfession', 'representativePhone', 'representativeEmail',
  'motherFirstName', 'motherLastName', 'motherIdNationality', 'motherIdNumber', 'motherPhone', 'motherEmail', 'motherProfession',
  'fatherFirstName', 'fatherLastName', 'fatherIdNationality', 'fatherIdNumber', 'fatherPhone', 'fatherEmail', 'fatherProfession',
  'studentPhotoUrl', 'representativePhotoUrl',
  'age', 'aula', 'paymentConfig', 'active', 'studentCardNumber',
];

const pickBody = (body) => {
  const picked = {};
  for (const key of STUDENT_BODY_FIELDS) {
    if (body[key] !== undefined) picked[key] = body[key];
  }
  return picked;
};

function buildGuardianFromFlat(prefix, data) {
  const firstName = `${prefix}FirstName`;
  const lastName = `${prefix}LastName`;
  const idNat = `${prefix}IdNationality`;
  const idNum = `${prefix}IdNumber`;
  const phone = `${prefix}Phone`;
  const email = `${prefix}Email`;
  const profession = `${prefix}Profession`;
  const hasFlat =
    data[firstName] != null ||
    data[lastName] != null ||
    data[idNum] != null ||
    data[phone] != null ||
    data[email] != null ||
    data[profession] != null ||
    data[idNat] != null;
  if (!hasFlat) return;
  const key = prefix.toLowerCase() === 'mother' ? 'mother' : 'father';
  if (!data[key] || typeof data[key] !== 'object') data[key] = {};
  const g = data[key];
  if (data[firstName] != null) g.firstName = data[firstName];
  if (data[lastName] != null) g.lastName = data[lastName];
  if (data[idNat] != null) g.idNationality = data[idNat];
  if (data[idNum] != null) g.idNumber = data[idNum];
  if (data[phone] != null) g.phone = data[phone];
  if (data[email] != null) g.email = data[email];
  if (data[profession] != null) g.profession = data[profession];
}

function buildRepresentative(data) {
  const hasFlat =
    data.representativeFirstName != null ||
    data.representativeLastName != null ||
    data.representativeIdNumber != null ||
    data.representativeIdNationality != null ||
    data.representativeRelationship != null ||
    data.representativeProfession != null ||
    data.representativePhone != null ||
    data.representativeEmail != null;
  if (!hasFlat) return;
  if (!data.representative || typeof data.representative !== 'object') data.representative = {};
  const r = data.representative;
  if (data.representativeFirstName != null) r.firstName = data.representativeFirstName;
  if (data.representativeLastName != null) r.lastName = data.representativeLastName;
  if (data.representativeIdNationality != null) r.idNationality = data.representativeIdNationality;
  if (data.representativeIdNumber != null) r.idNumber = data.representativeIdNumber;
  if (data.representativeRelationship != null) r.relationship = data.representativeRelationship;
  if (data.representativeProfession != null) r.profession = data.representativeProfession;
  if (data.representativePhone != null) r.phone = data.representativePhone;
  if (data.representativeEmail != null) r.email = data.representativeEmail;
}

/** Representante legal para pagos/notificaciones: copia desde madre/padre si aplica */
function syncLegalRepresentativeForPayments(data) {
  const lr = data.legalRepresentative;
  if (lr === 'madre' && data.mother && typeof data.mother === 'object') {
    const m = data.mother;
    data.representative = {
      firstName: m.firstName,
      lastName: m.lastName,
      idNationality: m.idNationality || 'V',
      idNumber: m.idNumber,
      phone: m.phone,
      email: m.email,
      profession: m.profession,
      relationship: 'madre',
    };
  } else if (lr === 'padre' && data.father && typeof data.father === 'object') {
    const f = data.father;
    data.representative = {
      firstName: f.firstName,
      lastName: f.lastName,
      idNationality: f.idNationality || 'V',
      idNumber: f.idNumber,
      phone: f.phone,
      email: f.email,
      profession: f.profession,
      relationship: 'padre',
    };
  }
}

function applyStudentCardNumber(data) {
  if (data.schoolLevel !== SCHOOL_LEVEL.PREESCOLAR && data.schoolLevel !== SCHOOL_LEVEL.PRIMARIA) return;
  const card = computeStudentCardNumber(data);
  if (card) data.studentCardNumber = card;
}

export const create = async (req, res, next) => {
  try {
    const data = pickBody(req.body);
    if (data.birthDate && typeof data.birthDate === 'string') {
      data.birthDate = new Date(data.birthDate);
    }
    if (data.enrollmentDate && typeof data.enrollmentDate === 'string') {
      data.enrollmentDate = new Date(data.enrollmentDate);
    }
    buildGuardianFromFlat('mother', data);
    buildGuardianFromFlat('father', data);
    buildRepresentative(data);
    if (data.legalRepresentative === 'madre' || data.legalRepresentative === 'padre') {
      syncLegalRepresentativeForPayments(data);
    }
    try {
      await assertGradeSectionAgainstConfig(data.schoolLevel, data.grade, data.section);
    } catch (e) {
      return res.status(e.statusCode || 400).json({ ok: false, message: e.message });
    }
    applyStudentCardNumber(data);
    const student = new Student(data);
    await student.save();
    res.status(201).json({ ok: true, data: student, message: 'Estudiante registrado.' });
  } catch (err) {
    console.log('ERROR CREATE STUDENT: 1111', err);
    if (err.code === 11000) {
      return res.status(400).json({ ok: false, message: 'Ya existe un estudiante con ese numero de identidad.' });
    }
    next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    const existing = await Student.findById(req.params.id).lean();
    if (!existing) {
      return res.status(404).json({ ok: false, message: 'Estudiante no encontrado.' });
    }
    const data = pickBody(req.body);
    if (data.birthDate && typeof data.birthDate === 'string') {
      data.birthDate = new Date(data.birthDate);
    }
    if (data.enrollmentDate && typeof data.enrollmentDate === 'string') {
      data.enrollmentDate = new Date(data.enrollmentDate);
    }
    buildGuardianFromFlat('mother', data);
    buildGuardianFromFlat('father', data);
    buildRepresentative(data);
    if (data.legalRepresentative === 'madre' || data.legalRepresentative === 'padre') {
      syncLegalRepresentativeForPayments(data);
    }
    const mergedLevel = data.schoolLevel !== undefined ? data.schoolLevel : existing.schoolLevel;
    const mergedGrade = data.grade !== undefined ? data.grade : existing.grade;
    const mergedSection = data.section !== undefined ? data.section : existing.section;
    try {
      await assertGradeSectionAgainstConfig(mergedLevel, mergedGrade, mergedSection);
    } catch (e) {
      return res.status(e.statusCode || 400).json({ ok: false, message: e.message });
    }
    let student = await Student.findByIdAndUpdate(
      req.params.id,
      { $set: data },
      { new: true, runValidators: true }
    );
    if (
      student &&
      (student.schoolLevel === SCHOOL_LEVEL.PREESCOLAR || student.schoolLevel === SCHOOL_LEVEL.PRIMARIA)
    ) {
      const card = computeStudentCardNumber(student.toObject());
      if (card && card !== student.studentCardNumber) {
        student = await Student.findByIdAndUpdate(
          req.params.id,
          { $set: { studentCardNumber: card } },
          { new: true, runValidators: true }
        );
      }
    }
    if (!student) {
      return res.status(404).json({ ok: false, message: 'Estudiante no encontrado.' });
    }
    res.json({ ok: true, data: student, message: 'Estudiante actualizado.' });
  } catch (err) {
    console.log('ERROR UPDATE STUDENT: ', err);
    if (err.code === 11000) {
      return res.status(400).json({ ok: false, message: 'Ya existe un estudiante con ese numero de identidad.' });
    }
    next(err);
  }
};

export const uploadExpedient = async (req, res, next) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ ok: false, message: 'Archivo requerido.' });
    }
    const url = getPublicPath(req, file) || `/uploads/expedients/${file.filename}`;
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { expedientUrl: url },
      { new: true }
    );
    if (!student) {
      return res.status(404).json({ ok: false, message: 'Estudiante no encontrado.' });
    }
    res.json({ ok: true, data: student, message: 'Expediente subido.' });
  } catch (err) {
    next(err);
  }
};

export const uploadFotoAlumno = async (req, res, next) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ ok: false, message: 'Archivo requerido.' });
    }
    const url = getPublicPath(req, file) || `/uploads/fotos-alumno/${file.filename}`;
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { studentPhotoUrl: url },
      { new: true }
    );
    if (!student) {
      return res.status(404).json({ ok: false, message: 'Estudiante no encontrado.' });
    }
    res.json({ ok: true, data: student, message: 'Foto del alumno subida.' });
  } catch (err) {
    next(err);
  }
};

export const uploadFotoRepresentante = async (req, res, next) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ ok: false, message: 'Archivo requerido.' });
    }
    const url = getPublicPath(req, file) || `/uploads/fotos-representante/${file.filename}`;
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { representativePhotoUrl: url },
      { new: true }
    );
    if (!student) {
      return res.status(404).json({ ok: false, message: 'Estudiante no encontrado.' });
    }
    res.json({ ok: true, data: student, message: 'Foto del representante subida.' });
  } catch (err) {
    next(err);
  }
};

export const quotaStatus = async (req, res, next) => {
  try {
    const perSection = await Student.aggregate([
      { $match: { active: true } },
      { $group: { _id: { year: '$grade', section: '$section' }, count: { $sum: 1 } } },
    ]);
    const maxPerSection = INSCRIPTION.MAX_STUDENTS_PER_SECTION;
    const totalSections = INSCRIPTION.TOTAL_SECTIONS;
    const grades = ['7', '8', '9', '10', '11', '12'];
    const sectionsList = ['A', 'B', 'C', 'D'];
    const sections = grades.flatMap((y) =>
      sectionsList.map((s) => ({
        year: y,
        section: s,
        current: perSection.find((x) => x._id.year === y && x._id.section === s)?.count ?? 0,
        max: maxPerSection,
        available: maxPerSection - (perSection.find((x) => x._id.year === y && x._id.section === s)?.count ?? 0),
      }))
    );
    res.json({
      ok: true,
      data: {
        sections,
        totalSections,
        classroomsAvailable: INSCRIPTION.CLASSROOMS_AVAILABLE,
        maxPerSection: maxPerSection,
      },
    });
  } catch (err) {
    next(err);
  }
};

function formatStudentIdDisplay(s) {
  const nat = s.idNationality || 'V';
  const num = (s.idNumber || '').trim();
  return num ? `${nat}-${num}` : '—';
}

export const reportPdf = async (req, res, next) => {
  try {
    const { grade, section, schoolLevel } = req.query;
    const filter = { active: { $ne: false } };
    if (grade) filter.grade = grade;
    if (section) filter.section = section;
    if (schoolLevel) filter.schoolLevel = schoolLevel;

    const students = await Student.find(filter)
      .sort({ schoolLevel: 1, grade: 1, section: 1, lastName: 1, firstName: 1 })
      .lean();

    const institution = await loadInstitutionGeneral();
    const subtitleParts = [];
    if (schoolLevel) subtitleParts.push(`Nivel: ${schoolLevel}`);
    if (grade) subtitleParts.push(`Grado/Ano: ${grade}`);
    if (section) subtitleParts.push(`Seccion: ${section}`);
    subtitleParts.push(`Total: ${students.length} estudiantes`);

    const filename = `reporte-estudiantes-${new Date().toISOString().slice(0, 10)}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
    doc.pipe(res);

    drawReportHeader(doc, {
      institution,
      reportTitle: 'Listado de estudiantes',
      reportSubtitle: subtitleParts.join(' — '),
    });

    const colWidths = [72, 118, 52, 28, 28, 88, 82, 72];
    const headers = ['Cedula', 'Nombre completo', 'Nivel', 'Grado', 'Secc.', 'Email', 'Telefono', 'F. inscripcion'];
    let y = doc.y;

    doc.fontSize(8).font('Helvetica-Bold');
    let x = 40;
    headers.forEach((h, i) => {
      doc.text(h, x, y, { width: colWidths[i], ellipsis: true });
      x += colWidths[i] + 4;
    });
    y += 14;
    doc.moveTo(40, y).lineTo(doc.page.width - 40, y).stroke();
    y += 6;

    doc.font('Helvetica');
    for (const s of students) {
      if (y > doc.page.height - 55) {
        doc.addPage({ size: 'A4', layout: 'landscape', margin: 40 });
        drawReportHeader(doc, {
          institution,
          reportTitle: 'Listado de estudiantes (continuacion)',
          reportSubtitle: subtitleParts.join(' — '),
        });
        y = doc.y;
        doc.fontSize(8).font('Helvetica-Bold');
        x = 40;
        headers.forEach((h, i) => {
          doc.text(h, x, y, { width: colWidths[i], ellipsis: true });
          x += colWidths[i] + 4;
        });
        y += 14;
        doc.moveTo(40, y).lineTo(doc.page.width - 40, y).stroke();
        y += 6;
        doc.font('Helvetica');
      }

      const fullName = [s.firstName, s.lastName].filter(Boolean).join(' ') || '—';
      const enrollDate = s.enrollmentDate ? new Date(s.enrollmentDate).toLocaleDateString('es') : '—';
      x = 40;
      const row = [
        formatStudentIdDisplay(s),
        fullName,
        (s.schoolLevel || '—').toString(),
        (s.grade || '—').toString(),
        (s.section || '—').toString(),
        (s.email || '').trim() || '—',
        (s.phone || '').trim() || '—',
        enrollDate,
      ];
      row.forEach((cell, i) => {
        doc.text(String(cell).slice(0, 32), x, y, { width: colWidths[i], ellipsis: true });
        x += colWidths[i] + 4;
      });
      y += 12;
    }

    drawGeneratedFooter(doc);
    doc.end();
  } catch (err) {
    if (!res.headersSent) next(err);
  }
};

/** PDF cedula estudiantil (preescolar y primaria) */
export const studentCardPdf = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id).lean();
    if (!student) {
      return res.status(404).json({ ok: false, message: 'Estudiante no encontrado.' });
    }
    if (student.schoolLevel !== SCHOOL_LEVEL.PREESCOLAR && student.schoolLevel !== SCHOOL_LEVEL.PRIMARIA) {
      return res.status(400).json({
        ok: false,
        message: 'La cedula estudiantil solo aplica a preescolar o primaria.',
      });
    }
    const institution = await loadInstitutionGeneral();
    const cardNumber = student.studentCardNumber || computeStudentCardNumber(student);
    const filename = `cedula-estudiantil-${student._id}-${new Date().toISOString().slice(0, 10)}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const doc = new PDFDocument({ margin: 36, size: 'A4' });
    doc.pipe(res);

    drawReportHeader(doc, {
      institution,
      reportTitle: 'Cedula estudiantil',
      reportSubtitle: institution.nombreInstitucion,
    });

    const left = doc.page.margins.left;
    const cardW = doc.page.width - left - doc.page.margins.right;
    const photoX = left;
    const photoY = doc.y;
    const photoSize = 100;
    if (student.studentPhotoUrl) {
      const abs = resolveLogoAbsolutePath(student.studentPhotoUrl);
      if (abs && fs.existsSync(abs)) {
        try {
          doc.image(abs, photoX, photoY, { width: photoSize, height: photoSize, fit: [photoSize, photoSize] });
        } catch {
          doc.rect(photoX, photoY, photoSize, photoSize).stroke('#cccccc');
          doc.fontSize(8).text('Sin foto', photoX + 30, photoY + 42);
        }
      } else {
        doc.rect(photoX, photoY, photoSize, photoSize).stroke('#cccccc');
        doc.fontSize(8).text('Sin foto', photoX + 30, photoY + 42);
      }
    } else {
      doc.rect(photoX, photoY, photoSize, photoSize).stroke('#cccccc');
      doc.fontSize(8).text('Sin foto', photoX + 30, photoY + 42);
    }

    const textX = photoX + photoSize + 16;
    let ty = photoY;
    doc.font('Helvetica-Bold').fontSize(12).text('Datos del estudiante', textX, ty);
    ty += 18;
    doc.font('Helvetica').fontSize(10);
    doc.text(`Nombre: ${[student.firstName, student.lastName].filter(Boolean).join(' ')}`, textX, ty);
    ty += 14;
    doc.text(`Cedula: ${formatStudentIdDisplay(student)}`, textX, ty);
    ty += 14;
    doc.text(`Nivel: ${student.schoolLevel || '—'}  |  Grado: ${student.grade || '—'}  |  Seccion: ${student.section || '—'}`, textX, ty);
    ty += 14;
    doc.font('Helvetica-Bold').text(`Codigo estudiantil: ${cardNumber || '—'}`, textX, ty);
    ty += 24;
    doc.font('Helvetica').fontSize(9).fillColor('#555555');
    doc.text(
      'Codigo generado a partir de la cedula del representante legal y el ano de nacimiento del alumno.',
      textX,
      ty,
      { width: cardW - photoSize - 16 }
    );
    doc.fillColor('#000000');

    doc.y = Math.max(doc.y, photoY + photoSize) + 24;
    drawGeneratedFooter(doc);
    doc.end();
  } catch (err) {
    if (!res.headersSent) next(err);
  }
};
