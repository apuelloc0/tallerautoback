/**
 * Utilidad para el cálculo de promedios de ítems o costos si fuera necesario.
 * Reemplaza la lógica que estaba en el pre-save de Mongoose.
 */
export function computeAverage(corte1, corte2, corte3) {
  const c = [corte1, corte2, corte3].filter((n) => n != null && !Number.isNaN(n));
  return c.length ? c.reduce((a, b) => a + b, 0) / c.length : undefined;
}

export const ORDER_ITEMS_TABLE = 'order_items';
export default ORDER_ITEMS_TABLE;
