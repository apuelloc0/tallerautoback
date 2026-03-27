/**
 * Cédula estudiantil (preescolar y primaria).
 * Fórmula: CD + AA + NN
 *   CD = Cédula (dígitos) del representante legal
 *   AA = Últimos 2 dígitos del año de nacimiento del estudiante
 *   NN = Número de hijo (ordinal), relleno con cero a 2 dígitos
 *
 * Ejemplo: representante 4257146, alumno nacido en 2015, 2.° hijo → "4257146" + "15" + "02" = "425714615 02"
 */
export function computeStudentCardNumber(student) {
  const repDigits = String(student.representative?.idNumber || '').replace(/\D/g, '');
  const nn = student.childNumber ? String(Number(student.childNumber)).padStart(2, '0') : '';
  if (!repDigits || !student.birthDate || !nn) return '';
  const yy = String(new Date(student.birthDate).getFullYear()).slice(-2);
  return `${repDigits}${yy}${nn}`;
}
