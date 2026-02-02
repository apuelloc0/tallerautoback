import Document from '../models/Document.js';
import { getPublicPath } from '../config/upload.js';

export const list = async (req, res, next) => {
  try {
    const { studentId, type } = req.query;
    const filter = {};
    if (studentId) filter.student = studentId;
    if (type) filter.type = type;
    const docs = await Document.find(filter).sort({ createdAt: -1 }).lean();
    res.json({ ok: true, data: docs });
  } catch (err) {
    next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ ok: false, message: 'Archivo requerido.' });
    }
    const url = getPublicPath(req, file) || `/uploads/documents/${file.filename}`;
    const doc = new Document({
      student: req.body.student,
      type: req.body.type || 'otro',
      fileUrl: url,
      originalName: file.originalname,
      description: req.body.description,
    });
    await doc.save();
    res.status(201).json({ ok: true, data: doc, message: 'Documento subido.' });
  } catch (err) {
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    const doc = await Document.findByIdAndDelete(req.params.id);
    if (!doc) {
      return res.status(404).json({ ok: false, message: 'Documento no encontrado.' });
    }
    res.json({ ok: true, message: 'Documento eliminado.' });
  } catch (err) {
    next(err);
  }
};
