import Grade from '../models/Grade.js';
import Student from '../models/Student.js';

export const list = async (req, res, next) => {
  try {
    const { studentId, year, subject } = req.query;
    const filter = {};
    if (studentId) filter.student = studentId;
    if (year) filter.year = Number(year);
    if (subject) filter.subject = new RegExp(subject, 'i');
    const grades = await Grade.find(filter)
      .populate('student', 'name ci year section')
      .sort({ year: -1, subject: 1 })
      .lean();
    res.json({ ok: true, data: grades });
  } catch (err) {
    next(err);
  }
};

export const getOne = async (req, res, next) => {
  try {
    const grade = await Grade.findById(req.params.id)
      .populate('student', 'name ci year section')
      .lean();
    if (!grade) {
      return res.status(404).json({ ok: false, message: 'Nota no encontrada.' });
    }
    res.json({ ok: true, data: grade });
  } catch (err) {
    next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    const grade = new Grade(req.body);
    await grade.save();
    const populated = await Grade.findById(grade._id)
      .populate('student', 'name ci year section')
      .lean();
    res.status(201).json({ ok: true, data: populated, message: 'Nota registrada.' });
  } catch (err) {
    next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    const grade = await Grade.findById(req.params.id);
    if (!grade) {
      return res.status(404).json({ ok: false, message: 'Nota no encontrada.' });
    }
    const { corte1, corte2, corte3, ...rest } = req.body;
    if (corte1 !== undefined) grade.corte1 = corte1;
    if (corte2 !== undefined) grade.corte2 = corte2;
    if (corte3 !== undefined) grade.corte3 = corte3;
    Object.assign(grade, rest);
    await grade.save();
    const populated = await Grade.findById(grade._id)
      .populate('student', 'name ci year section')
      .lean();
    res.json({ ok: true, data: populated });
  } catch (err) {
    next(err);
  }
};

/** Carga masiva de notas (array de { student, year, subject, corte1, corte2, corte3 }) */
export const bulkUpsert = async (req, res, next) => {
  try {
    const items = req.body.items || req.body;
    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({ ok: false, message: 'Se requiere un array de notas.' });
    }
    const results = [];
    for (const item of items) {
      const g = await Grade.findOneAndUpdate(
        {
          student: item.student,
          year: item.year,
          subject: item.subject,
        },
        {
          $set: {
            corte1: item.corte1,
            corte2: item.corte2,
            corte3: item.corte3,
          },
        },
        { new: true, upsert: true, runValidators: true }
      );
      results.push(g);
    }
    res.json({ ok: true, data: results, message: `${results.length} notas procesadas.` });
  } catch (err) {
    next(err);
  }
};

/** Filtro de mejores notas */
export const bestGrades = async (req, res, next) => {
  try {
    const { year, subject, limit = 20 } = req.query;
    const filter = {};
    if (year) filter.year = Number(year);
    if (subject) filter.subject = new RegExp(subject, 'i');
    const grades = await Grade.find(filter)
      .populate('student', 'name ci year section')
      .sort({ average: -1 })
      .limit(Number(limit) || 20)
      .lean();
    res.json({ ok: true, data: grades });
  } catch (err) {
    next(err);
  }
};
