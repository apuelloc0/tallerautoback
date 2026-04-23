import AcademicConfig from '../models/AcademicConfig.js';

function buildPayload(body = {}) {
  const {
    capacidadMaxima,
    anosEscolares = [],
    periodos = [],
    sistemaCalificacion = {},
    grados = [],
    materias = [],
  } = body;

  return {
    capacidadMaxima: Math.max(0, Number(capacidadMaxima) || 0),
    anosEscolares: Array.isArray(anosEscolares)
      ? anosEscolares.map((a) => ({
          nombre: a.nombre,
          activo: !!a.activo,
        }))
      : [],
    periodos: Array.isArray(periodos)
      ? periodos.map((p) => ({
          nombre: p.nombre,
          activo: !!p.activo,
        }))
      : [],
    sistemaCalificacion: {
      notaMinima:
        sistemaCalificacion && sistemaCalificacion.notaMinima != null
          ? Number(sistemaCalificacion.notaMinima)
          : 10,
    },
    grados: Array.isArray(grados)
      ? grados.map((g) => ({
          nombre: g.nombre,
          schoolLevel: ['PREESCOLAR', 'PRIMARIA', 'LICEO'].includes(g.schoolLevel)
            ? g.schoolLevel
            : 'PRIMARIA',
          secciones: Array.isArray(g.secciones) ? g.secciones : [],
        }))
      : [],
    materias: Array.isArray(materias)
      ? materias.map((m) => ({
          nombre: m.nombre,
          horas: m.horas != null ? Number(m.horas) : 0,
        }))
      : [],
  };
}

export const getConfig = async (req, res, next) => {
  try {
    let config = await AcademicConfig.findOne().lean();
    if (!config) {
      // Crear una configuración por defecto la primera vez
      const defaults = buildPayload({
        capacidadMaxima: 0,
        anosEscolares: [],
        periodos: [],
        sistemaCalificacion: { notaMinima: 10 },
        grados: [],
        materias: [],
      });
      const created = await AcademicConfig.create(defaults);
      config = created.toObject();
    }
    res.json({ ok: true, data: config });
  } catch (err) {
    next(err);
  }
};

export const updateConfig = async (req, res, next) => {
  try {
    const payload = buildPayload(req.body || {});
    const config = await AcademicConfig.findOneAndUpdate(
      {},
      { $set: payload },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();
    res.json({ ok: true, data: config, message: 'Configuración académica guardada.' });
  } catch (err) {
    next(err);
  }
};

