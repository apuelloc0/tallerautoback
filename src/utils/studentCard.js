/**
 * Código de cédula estudiantil (preescolar y primaria).
 * Composición documentada:
 * 1) Últimos 4 dígitos numéricos de la cédula del representante legal
 * 2) Últimos 2 dígitos del año de nacimiento del estudiante
 * 3) Primeros 4 dígitos numéricos de la cédula del representante legal
 *
 * Ejemplo: representante 12.345.678, alumno nacido en 2015 → 5678151234
 */
export function computeStudentCardNumber(student) {
  const repDigits = String(student.representative?.idNumber || '').replace(/\D/g, '');
  if (repDigits.length < 4 || !student.birthDate) return '';
  const yy = String(new Date(student.birthDate).getFullYear()).slice(-2);
  const last4 = repDigits.slice(-4);
  const first4 = repDigits.slice(0, 4).padStart(4, '0');
  return `${last4}${yy}${first4}`;
}
