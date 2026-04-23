import jwt from 'jsonwebtoken';
import { PERMISSIONS } from '../config/constants.js';
import supabase from '../config/db.js';
import { USERS_TABLE } from '../models/User.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      return res.status(401).json({ ok: false, message: 'Acceso denegado. Token requerido.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const { data: user, error } = await supabase
      .from(USERS_TABLE)
      .select(`
        id, username, full_name, role, active, workshop_id,
        workshops ( name, join_code_tech, join_code_recep, address, phone, tax_rate, payment_status )
      `)
      .eq('id', decoded.userId)
      .single();

    if (error || !user) {
      return res.status(401).json({ ok: false, message: 'Usuario no encontrado.' });
    }
    if (user.active === false) {
      return res.status(401).json({ ok: false, message: 'Cuenta desactivada. Contacte a la administración.' });
    }

    // Manejamos el caso de que workshops sea un objeto o un array (comportamiento de Supabase en Joins)
    const workshopData = Array.isArray(user.workshops) ? user.workshops[0] : user.workshops;

    // SEGURIDAD SaaS: Si el usuario tiene taller pero el taller ya no existe (fue borrado)
    if (user.workshop_id && !workshopData && user.role !== 'SUPER_ADMIN') {
      return res.status(401).json({ 
        ok: false, 
        message: 'Tu taller ha sido eliminado de la plataforma. Contacta soporte.' 
      });
    }

    // SEGURIDAD SaaS: Bloqueo por falta de pago (Suscripción inactiva)
    if (workshopData?.payment_status === 'suspended' && user.role !== 'SUPER_ADMIN') {
      return res.status(402).json({ 
        ok: false, 
        message: 'Tu taller se encuentra suspendido por falta de pago. Contacta a administración.' 
      });
    }

    const flatUser = {
      ...user,
      join_code_tech: workshopData?.join_code_tech || null,
      join_code_recep: workshopData?.join_code_recep || null,
      workshop_name: workshopData?.name || null,
      address: workshopData?.address || null,
      phone: workshopData?.phone || null,
      tax_rate: workshopData?.tax_rate || 16
    };
    
    // Eliminamos el objeto anidado para no confundir al frontend
    delete flatUser.workshops; 

    req.user = flatUser;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ ok: false, message: 'Sesión expirada.' });
    }
    return res.status(401).json({ ok: false, message: 'Token inválido.' });
  }
};

/**
 * Requiere uno de los roles indicados para la acción.
 * permissionKey: clave de PERMISSIONS (ej: 'ESTUDIANTES_REGISTRO')
 */
export const requirePermission = (permissionKey) => {
  return (req, res, next) => {
    const allowed = PERMISSIONS[permissionKey];
    if (!allowed || !allowed.includes(req.user.role)) {
      return res.status(403).json({
        ok: false,
        message: 'No tiene permiso para realizar esta acción.',
      });
    }
    next();
  };
};

/** Requiere uno de los roles indicados */
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        ok: false,
        message: 'No tiene permiso para esta sección.',
      });
    }
    next();
  };
};
