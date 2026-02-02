import jwt from 'jsonwebtoken';
import { ROLES, PERMISSIONS } from '../config/constants.js';
import User from '../models/User.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    console.log('token', token);
    if (!token) {
      return res.status(401).json({ ok: false, message: 'Acceso denegado. Token requerido.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password -securityQuestions.answer');
    if (!user) {
      return res.status(401).json({ ok: false, message: 'Usuario no encontrado.' });
    }

    req.user = user;
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
