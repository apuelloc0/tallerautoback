import AcademicConfig from '../models/AcademicConfig.js';

function levelOnGrade(g) {
  const sl = g?.schoolLevel;
  return ['PREESCOLAR', 'PRIMARIA', 'LICEO'].includes(sl) ? sl : 'PRIMARIA';
}

/**
 * Valida que grade exista en AcademicConfig para el nivel y que section (si viene) este en ese grado.
 * Omite si no hay nivel (legacy) o no hay grado.
 */
export async function assertGradeSectionAgainstConfig(schoolLevel, grade, section) {
  if (grade == null || String(grade).trim() === '') return;
  if (!schoolLevel) return;
  const config = await AcademicConfig.findOne().lean();
  const grados = config?.grados || [];
  const gRow = grados.find(
    (g) =>
      levelOnGrade(g) === schoolLevel &&
      String(g.nombre || '').trim() === String(grade).trim()
  );
  if (!gRow) {
    const e = new Error('Grado no configurado para este nivel en la institucion');
    e.statusCode = 400;
    throw e;
  }
  if (section != null && String(section).trim() !== '') {
    const secs = Array.isArray(gRow.secciones) ? gRow.secciones.map((s) => String(s).trim()) : [];
    if (!secs.includes(String(section).trim())) {
      const e = new Error('Seccion no valida para el grado');
      e.statusCode = 400;
      throw e;
    }
  }
}
