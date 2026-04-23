import supabase from '../config/db.js';
import { ORDER_ITEMS_TABLE } from '../models/ServiceItem.js';

/** Listar ítems de una orden */
export const list = async (req, res, next) => {
  try {
    const { orderId } = req.query;
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
    const { data, error } = await supabase
      .from(ORDER_ITEMS_TABLE)
      .insert([req.body])
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
    const { error } = await supabase.from(ORDER_ITEMS_TABLE).delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true, message: 'Ítem eliminado.' });
  } catch (err) {
    next(err);
  }
};
