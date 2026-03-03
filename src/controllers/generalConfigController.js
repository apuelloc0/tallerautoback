import AcademicConfig from '../models/AcademicConfig.js';

const DEFAULT_GENERAL = {
  nombreInstitucion: 'Unidad Educativa Privada',
  rif: 'J-12345678-9',
  direccion: 'Av. Principal, Sector Centro',
  ciudad: 'Caracas',
  telefono: '0212-1234567',
  email: 'contacto@institucion.edu.ve',
  idioma: 'es',
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
  };
}

export const getConfig = async (req, res, next) => {
  try {
    const doc = await AcademicConfig.findOne().lean();
    const general = doc?.general && typeof doc.general === 'object'
      ? { ...DEFAULT_GENERAL, ...doc.general }
      : { ...DEFAULT_GENERAL };
    res.json({ ok: true, data: general });
  } catch (err) {
    next(err);
  }
};

export const updateConfig = async (req, res, next) => {
  try {
    const payload = buildGeneralPayload(req.body || {});
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
