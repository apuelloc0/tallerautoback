/**
 * Fechas solo-día (YYYY-MM-DD) como día civil en UTC (medianoche UTC).
 * Evita que new Date("2026-01-01") se muestre o se combine mal en zonas UTC-4, etc.
 */
export function parseDateOnlyInput(value) {
  if (value == null || value === '') return undefined;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return value;
    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
  }
  const s = String(value).trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (!m) return new Date(s);
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!y || mo < 1 || mo > 12 || d < 1 || d > 31) return new Date(s);
  return new Date(Date.UTC(y, mo - 1, d));
}
