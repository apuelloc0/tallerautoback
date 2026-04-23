import supabase from '../config/db.js';

/**
 * Middleware para verificar si el taller tiene una suscripción activa.
 * Se debe ejecutar DESPUÉS del middleware de autenticación.
 */
export const checkSubscription = async (req, res, next) => {
  try {
    // El middleware de auth ya debió poner el workshop_id y role en req.user
    const { workshop_id, role } = req.user || {};

    // El Super Admin nunca es bloqueado
    if (role === 'SUPER_ADMIN') return next();

    if (!workshop_id) {
      return res.status(403).json({ ok: false, message: 'Usuario sin taller asociado.' });
    }

    const { data: workshop, error } = await supabase
      .from('workshops')
      .select('payment_status')
      .eq('id', workshop_id)
      .single();

    if (error || !workshop) {
      return res.status(404).json({ ok: false, message: 'Estado del taller no encontrado.' });
    }

    // Bloqueamos si no está activo (suspended o pending)
    if (workshop.payment_status === 'suspended' || workshop.payment_status === 'pending') {
      return res.status(402).json({ 
        ok: false, 
        message: 'Tu suscripción no está activa. Por favor, regulariza tu pago.',
        status: workshop.payment_status
      });
    }

    next();
  } catch (err) {
    next(err);
  }
};