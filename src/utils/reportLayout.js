import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import AcademicConfig from '../models/AcademicConfig.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function getUploadRoot() {
  return process.env.UPLOAD_PATH || path.join(__dirname, '..', '..', 'uploads');
}

/**
 * logoUrl guardada como /uploads/sub/file.ext → ruta absoluta para PDFKit.
 */
export function resolveLogoAbsolutePath(logoUrl) {
  if (!logoUrl || typeof logoUrl !== 'string') return null;
  const trimmed = logoUrl.trim();
  if (!trimmed.startsWith('/uploads/')) return null;
  const rel = trimmed.replace(/^\/uploads\/?/, '');
  const full = path.join(getUploadRoot(), rel);
  return fs.existsSync(full) ? full : null;
}

export async function loadInstitutionGeneral() {
  const doc = await AcademicConfig.findOne().lean();
  const g = doc?.general && typeof doc.general === 'object' ? doc.general : {};
  return {
    nombreInstitucion: String(g.nombreInstitucion || 'Unidad Educativa Privada').trim(),
    rif: String(g.rif || '').trim(),
    telefono: String(g.telefono || '').trim(),
    email: String(g.email || '').trim(),
    direccion: String(g.direccion || '').trim(),
    ciudad: String(g.ciudad || 'Caracas').trim(),
    logoUrl: String(g.logoUrl || '').trim(),
  };
}

/**
 * Cintillo institucional + título del reporte (PDF).
 * @param {PDFDocument} doc
 */
export function drawReportHeader(doc, { institution, reportTitle, reportSubtitle }) {
  const pageW = doc.page.width;
  const bandH = 68;
  const left = doc.page.margins.left;
  const right = doc.page.margins.right;
  const usableW = pageW - left - right;

  doc.save();
  doc.rect(0, 0, pageW, bandH).fill('#0952C8');

  const logoPath = resolveLogoAbsolutePath(institution?.logoUrl);
  let textX = left;
  if (logoPath) {
    try {
      doc.image(logoPath, left, 10, { width: 48, height: 48, fit: [48, 48] });
      textX = left + 56;
    } catch {
      /* omit logo if corrupt */
    }
  }

  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(13);
  doc.text(institution?.nombreInstitucion || 'Institución', textX, 14, {
    width: pageW - textX - right,
    ellipsis: true,
  });
  doc.font('Helvetica').fontSize(8.5);
  const meta = [
    institution?.rif ? `RIF: ${institution.rif}` : null,
    institution?.direccion || null,
    institution?.ciudad || null,
    institution?.telefono ? `Telf. ${institution.telefono}` : null,
  ]
    .filter(Boolean)
    .join(' · ');
  if (meta) {
    doc.text(meta, textX, 34, { width: pageW - textX - right, ellipsis: true });
  }
  doc.restore();

  doc.fillColor('#000000');
  doc.y = bandH + 14;
  doc.x = left;
  doc.font('Helvetica-Bold').fontSize(15).fillColor('#1a1a1a');
  doc.text(reportTitle, left, doc.y, { align: 'center', width: usableW });
  doc.moveDown(0.35);
  if (reportSubtitle) {
    doc.font('Helvetica').fontSize(10).fillColor('#444444');
    doc.text(reportSubtitle, left, doc.y, { align: 'center', width: usableW });
    doc.moveDown(0.5);
  }
  doc.fillColor('#000000');
}

export function drawGeneratedFooter(doc) {
  const text = `Generado: ${new Date().toLocaleString('es-VE', { dateStyle: 'short', timeStyle: 'medium' })}`;
  const m = doc.page.margins;
  const y = doc.page.height - m.bottom - 4;
  doc.font('Helvetica').fontSize(8).fillColor('#666666');
  doc.text(text, m.left, y, {
    width: doc.page.width - m.left - m.right,
    align: 'center',
  });
  doc.fillColor('#000000');
}
