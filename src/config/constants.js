/**
 * Roles del sistema Taller Automotriz (Sistema Interno)
 */
export const ROLES = {
  ADMINISTRADOR: 'ADMINISTRADOR', // Dueño / Gerente: Acceso total
  RECEPCIONISTA: 'RECEPCIONISTA', // Registro de vehículos, clientes y facturación
  TECNICO: 'TECNICO',             // Gestión de reparaciones, notas y repuestos
};

/** Quién puede ver cada recurso */
export const PERMISSIONS = {
  USUARIOS_GESTION: [ROLES.ADMINISTRADOR],
  VEHICULOS_GESTION: [ROLES.ADMINISTRADOR, ROLES.RECEPCIONISTA],
  ORDENES_GESTION: [ROLES.ADMINISTRADOR, ROLES.RECEPCIONISTA],
  ORDENES_TECNICO: [ROLES.ADMINISTRADOR, ROLES.TECNICO],
  FACTURACION_GESTION: [ROLES.ADMINISTRADOR, ROLES.RECEPCIONISTA],
  INVENTARIO_GESTION: [ROLES.ADMINISTRADOR, ROLES.RECEPCIONISTA, ROLES.TECNICO],
  REPORTES_FULL: [ROLES.ADMINISTRADOR],
  CONFIGURACION: [ROLES.ADMINISTRADOR],
};

/** Estados de la Orden de Servicio */
export const ORDER_STATUS = {
  INGRESADO: 'INGRESADO',
  DIAGNOSTICO: 'DIAGNOSTICO',
  ESPERA_REPUESTOS: 'ESPERA_REPUESTOS',
  EN_REPARACION: 'EN_REPARACION',
  PRUEBA_RUTA: 'PRUEBA_RUTA',
  LISTO: 'LISTO',
  ENTREGADO: 'ENTREGADO',
};

export const ORDER_STATUS_LIST = Object.values(ORDER_STATUS);

/** Prefijos moviles Venezuela 04xx (solo digitos, sin espacios; sin lineas fijas 02xx) */
export const PHONE_PREFIXES = [
  '0412', '0414', '0416', '0422', '0424', '0426',
];
