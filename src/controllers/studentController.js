import Student from '../models/Student.js';
import Document from '../models/Document.js';
import { INSCRIPTION } from '../config/constants.js';
import { getPublicPath } from '../config/upload.js';

export const list = async (req, res, next) => {
  try {
    const { year, section, grado, seccion, enrollmentType, tipoIngreso, search } = req.query;
    const filter = { active: true };
    if (year) filter.year = Number(year);
    if (section) filter.section = section;
    if (grado) filter.grado = grado;
    if (seccion) filter.seccion = seccion;
    if (enrollmentType) filter.enrollmentType = enrollmentType;
    if (tipoIngreso) filter.tipoIngreso = tipoIngreso;
    if (search) {
      const term = new RegExp(search, 'i');
      filter.$or = [
        { name: term },
        { ci: term },
        { cedula: term },
        { nombres: term },
        { apellidos: term },
      ];
    }
    const students = await Student.find(filter)
      .sort({ grado: 1, seccion: 1, nombres: 1, apellidos: 1 })
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
  'nombres', 'apellidos', 'cedula', 'fechaNacimiento', 'sexo',
  'direccion', 'lugarNacimiento', 'fechaInscripcion', 'grado', 'seccion',
  'institucionProveniente', 'tipoIngreso', 'email', 'telefono',
  'nombresRepresentante', 'apellidosRepresentante', 'cedulaRepresentante',
  'parentezco', 'profesionRepresentante', 'fotoAlumno', 'fotoRepresentante',
  'name', 'ci', 'year', 'section', 'edad', 'genero', 'aula', 'enrollmentType', 'paymentConfig', 'active'
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
    if (data.fechaNacimiento && typeof data.fechaNacimiento === 'string') {
      data.fechaNacimiento = new Date(data.fechaNacimiento);
    }
    if (data.fechaInscripcion && typeof data.fechaInscripcion === 'string') {
      data.fechaInscripcion = new Date(data.fechaInscripcion);
    }
    console.log('data', data);
    const student = new Student(data);
    await student.save();
    res.status(201).json({ ok: true, data: student, message: 'Estudiante registrado.' });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ ok: false, message: 'Ya existe un estudiante con esa cédula.' });
    }
    next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    const data = pickBody(req.body);
    if (data.fechaNacimiento && typeof data.fechaNacimiento === 'string') {
      data.fechaNacimiento = new Date(data.fechaNacimiento);
    }
    if (data.fechaInscripcion && typeof data.fechaInscripcion === 'string') {
      data.fechaInscripcion = new Date(data.fechaInscripcion);
    }
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
      return res.status(400).json({ ok: false, message: 'Ya existe un estudiante con esa cédula.' });
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
      { fotoAlumno: url },
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
      { fotoRepresentante: url },
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
      { $group: { _id: { year: '$year', section: '$section' }, count: { $sum: 1 } } },
    ]);
    const maxPerSection = INSCRIPTION.MAX_STUDENTS_PER_SECTION;
    const totalSections = INSCRIPTION.TOTAL_SECTIONS;
    const sections = INSCRIPTION.YEARS.flatMap((y) =>
      ['A', 'B'].map((s) => ({
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
