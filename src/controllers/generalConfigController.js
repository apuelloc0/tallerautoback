import AcademicConfig from '../models/AcademicConfig.js';
import { getPublicPath } from '../config/upload.js';

export const DEFAULT_GENERAL = {
  nombreInstitucion: 'Unidad Educativa Privada',
  rif: 'J-12345678-9',
  direccion: 'Av. Principal, Sector Centro',
  ciudad: 'Caracas',
  telefono: '0212-1234567',
  email: 'contacto@institucion.edu.ve',
  idioma: 'es',
  logoUrl: '',
};

function buildGeneralPayload(body = {}) {
  return {
    nombreInstitucion: String(body.nombreInstitucion ?? DEFAULT_GENERAL.nombreInstitucion).trim(),
    rif: String(body.rif ?? '').trim(),
    telefono: String(body.telefono ?? '').trim(),
    email: String(body.email ?? '').trim(),
    direccion: String(body.direccion ?? '').trim(),
    ciudad: String(body.ciudad ?? DEFAULT_GENERAL.ciudad).trim(),
    idioma: String(body.idioma ?? DEFAULT_GENERAL.idioma).trim(),
    logoUrl: String(body.logoUrl ?? '').trim(),
  };
}

export const getConfig = async (req, res, next) => {
  try {
    const doc = await AcademicConfig.findOne().lean();
    const general = doc?.general && typeof doc.general === 'object'
      ? { ...DEFAULT_GENERAL, ...doc.general, logoUrl: doc.general.logoUrl ?? '' }
      : { ...DEFAULT_GENERAL };
    res.json({ ok: true, data: general });
  } catch (err) {
    next(err);
  }
};

export const updateConfig = async (req, res, next) => {
  try {
    const existing = await AcademicConfig.findOne().lean();
    const prev = existing?.general && typeof existing.general === 'object' ? existing.general : {};
    const body = req.body || {};
    const payload = buildGeneralPayload({
      ...prev,
      ...body,
      logoUrl: body.logoUrl !== undefined ? body.logoUrl : (prev.logoUrl ?? ''),
    });
    await AcademicConfig.findOneAndUpdate(
      {},
      { $set: { general: payload } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.json({ ok: true, data: payload, message: 'Configuración general guardada.' });
  } catch (err) {
    next(err);
  }
};

/** Subir logo para reportes / cintillo. Actualiza general.logoUrl */
export const uploadLogo = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, message: 'Archivo de imagen requerido.' });
    }
    const url = getPublicPath(req, req.file);
    const existing = await AcademicConfig.findOne().lean();
    const prev = existing?.general && typeof existing.general === 'object' ? existing.general : {};
    const payload = buildGeneralPayload({ ...DEFAULT_GENERAL, ...prev, logoUrl: url });
    await AcademicConfig.findOneAndUpdate(
      {},
      { $set: { general: payload } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.json({ ok: true, data: { logoUrl: url }, message: 'Logo actualizado.' });
  } catch (err) {
    next(err);
  }
};
