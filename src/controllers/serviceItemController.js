import supabase from '../config/db.js';
import { ORDER_ITEMS_TABLE } from '../models/ServiceItem.js';

/** Listar ítems de una orden */
export const list = async (req, res, next) => {
  try {
    const { orderId } = req.query;

    // SEGURIDAD SaaS: Verificar primero si la orden pertenece al taller
    const { data: order } = await supabase
      .from('service_orders')
      .select('workshop_id')
      .eq('id', orderId)
      .single();

    if (!order || (req.user.role !== 'SUPER_ADMIN' && order.workshop_id !== req.user.workshop_id)) {
      return res.status(403).json({ ok: false, message: 'No tiene permiso para ver los ítems de esta orden.' });
    }

    const { data, error } = await supabase
      .from(ORDER_ITEMS_TABLE)
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
};

/** Agregar repuesto o servicio a una orden */
export const create = async (req, res, next) => {
  try {
    const { order_id } = req.body;
    const workshop_id = req.user.workshop_id;

    // SEGURIDAD SaaS: Validar que la orden pertenece al taller del usuario
    const { data: order } = await supabase
      .from('service_orders')
      .select('workshop_id')
      .eq('id', order_id)
      .single();

    if (!order || (req.user.role !== 'SUPER_ADMIN' && order.workshop_id !== workshop_id)) {
      return res.status(403).json({ ok: false, message: 'No tiene permiso para modificar esta orden.' });
    }

    const { data, error } = await supabase
      .from(ORDER_ITEMS_TABLE)
      .insert([{ ...req.body, workshop_id }]) // Forzamos el workshop_id del usuario
      .select()
      .single();

    if (error) {
      console.error('❌ Error de Supabase al agregar ítem:', error);
      return res.status(400).json({ ok: false, message: error.message });
    }

    res.status(201).json({ ok: true, data, message: 'Ítem agregado a la orden.' });
  } catch (err) {
    next(err);
  }
};

/** Actualizar cantidad o precio de un ítem */
export const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // SEGURIDAD SaaS: Verificar propiedad del ítem
    let queryCheck = supabase.from(ORDER_ITEMS_TABLE).select('workshop_id').eq('id', id);
    if (req.user.role !== 'SUPER_ADMIN') {
      queryCheck = queryCheck.eq('workshop_id', req.user.workshop_id);
    }
    const { data: item } = await queryCheck.single();

    if (!item) return res.status(403).json({ ok: false, message: 'Ítem no encontrado o acceso denegado.' });

    const { data, error } = await supabase
      .from(ORDER_ITEMS_TABLE)
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
};

/** Eliminar ítem de la orden */
export const remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    // SEGURIDAD SaaS: Solo permitir borrar si el ítem pertenece al taller
    let query = supabase.from(ORDER_ITEMS_TABLE).delete().eq('id', id);
    
    if (req.user.role !== 'SUPER_ADMIN') {
      query = query.eq('workshop_id', req.user.workshop_id);
    }

    const { error } = await query;
    if (error) throw error;
    res.json({ ok: true, message: 'Ítem eliminado.' });
  } catch (err) {
    next(err);
  }
};
