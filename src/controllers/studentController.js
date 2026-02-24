import Student from '../models/Student.js';
import Document from '../models/Document.js';
import { INSCRIPTION } from '../config/constants.js';
import { getPublicPath } from '../config/upload.js';

export const list = async (req, res, next) => {
  try {
    const { year, section, grade, enrollmentType, search } = req.query;
    const filter = { active: true };
    if (year) filter.grade = String(year);
    if (section) filter.section = section;
    if (grade) filter.grade = grade;
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
      .sort({ grade: 1, section: 1, firstName: 1, lastName: 1 })
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

/** Campos que acepta el body de creación/actualización (alineados al formulario frontend) */
const STUDENT_BODY_FIELDS = [
  'firstName', 'lastName', 'idNumber', 'birthDate', 'gender',
  'address', 'birthPlace', 'enrollmentDate', 'grade', 'section',
  'previousInstitution', 'enrollmentType', 'email', 'phone',
  'representative', 'representativeFirstName', 'representativeLastName', 'representativeIdNumber',
  'representativeRelationship', 'representativeProfession',
  'studentPhotoUrl', 'representativePhotoUrl',
  'age', 'aula', 'paymentConfig', 'active'
];

const pickBody = (body) => {
  const picked = {};
  for (const key of STUDENT_BODY_FIELDS) {
    if (body[key] !== undefined) picked[key] = body[key];
  }
  return picked;
};

export const create = async (req, res, next) => {
  try {
    const data = pickBody(req.body);
    if (data.birthDate && typeof data.birthDate === 'string') {
      data.birthDate = new Date(data.birthDate);
    }
    if (data.enrollmentDate && typeof data.enrollmentDate === 'string') {
      data.enrollmentDate = new Date(data.enrollmentDate);
    }
    buildRepresentative(data);
    const student = new Student(data);
    await student.save();
    res.status(201).json({ ok: true, data: student, message: 'Estudiante registrado.' });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ ok: false, message: 'Ya existe un estudiante con ese número de identidad.' });
    }
    next(err);
  }
};

function buildRepresentative(data) {
  const hasFlat = data.representativeFirstName != null || data.representativeLastName != null ||
    data.representativeIdNumber != null || data.representativeRelationship != null ||
    data.representativeProfession != null;
  if (!hasFlat) return;
  if (!data.representative || typeof data.representative !== 'object') data.representative = {};
  if (data.representativeFirstName != null) data.representative.firstName = data.representativeFirstName;
  if (data.representativeLastName != null) data.representative.lastName = data.representativeLastName;
  if (data.representativeIdNumber != null) data.representative.idNumber = data.representativeIdNumber;
  if (data.representativeRelationship != null) data.representative.relationship = data.representativeRelationship;
  if (data.representativeProfession != null) data.representative.profession = data.representativeProfession;
}

export const update = async (req, res, next) => {
  try {
    const data = pickBody(req.body);
    if (data.birthDate && typeof data.birthDate === 'string') {
      data.birthDate = new Date(data.birthDate);
    }
    if (data.enrollmentDate && typeof data.enrollmentDate === 'string') {
      data.enrollmentDate = new Date(data.enrollmentDate);
    }
    buildRepresentative(data);
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { $set: data },
      { new: true, runValidators: true }
    );
    if (!student) {
      return res.status(404).json({ ok: false, message: 'Estudiante no encontrado.' });
    }
    res.json({ ok: true, data: student, message: 'Estudiante actualizado.' });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ ok: false, message: 'Ya existe un estudiante con ese número de identidad.' });
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

/** Cupos: 40 por sección, 10 secciones, 13 aulas */
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
