import supabase from '../config/db.js';
import { CLIENTS_TABLE } from '../models/Client.js';

/** Listar clientes con filtros de búsqueda */
export const list = async (req, res, next) => {
  try {
    const { search } = req.query;
    let query = supabase
      .from(CLIENTS_TABLE)
      .select('*')
      .eq('active', true);

    // SEGURIDAD SaaS: Filtrar por taller
    if (req.user.role !== 'SUPER_ADMIN') {
      query = query.eq('workshop_id', req.user.workshop_id);
    }

    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,id_number.ilike.%${search}%`);
    }

    const { data, error } = await query.order('last_name', { ascending: true });
    if (error) throw error;

    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
};

/** Obtener un cliente y sus vehículos asociados */
export const getOne = async (req, res, next) => {
  try {
    const { data: client, error } = await supabase
      .from(CLIENTS_TABLE)
      .select('*, vehicles(*)')
      .eq('id', req.params.id)
      .single();

    if (error || !client) {
      return res.status(404).json({ ok: false, message: 'Cliente no encontrado.' });
    }

    // SEGURIDAD SaaS: Verificar pertenencia
    if (req.user.role !== 'SUPER_ADMIN' && client.workshop_id !== req.user.workshop_id) {
      return res.status(403).json({ ok: false, message: 'Acceso denegado.' });
    }

    res.json({ ok: true, data: client });
  } catch (err) {
    next(err);
  }
};

/** Crear cliente */
export const create = async (req, res, next) => {
  try {
    const { id_number } = req.body;
    const clientData = { ...req.body, workshop_id: req.user.workshop_id };

    // Verificar si el ID (Cédula/RIF) ya existe
    if (id_number) {
      const { data: existing } = await supabase
        .from(CLIENTS_TABLE)
        .select('id, first_name, last_name')
        .eq('id_number', id_number)
        .single();
      
      if (existing) {
        return res.status(400).json({ 
          ok: false, 
          message: `El número de identificación ${id_number} ya está registrado a nombre de ${existing.first_name} ${existing.last_name}.` 
        });
      }
    }

    const { data, error } = await supabase
      .from(CLIENTS_TABLE)
      .insert([clientData])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ ok: true, data, message: 'Cliente registrado correctamente.' });
  } catch (err) {
    next(err);
  }
};

/** Actualizar cliente */
export const update = async (req, res, next) => {
  try {
    let query = supabase.from(CLIENTS_TABLE).update(req.body);

    // SEGURIDAD SaaS: Solo actualizar si pertenece al taller
    if (req.user.role !== 'SUPER_ADMIN') {
      query = query.eq('workshop_id', req.user.workshop_id);
    }

    const { data, error } = await query
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ ok: true, data, message: 'Datos del cliente actualizados.' });
  } catch (err) {
    next(err);
  }
};

/** Desactivar cliente (Soft delete) */
export const remove = async (req, res, next) => {
  try {
    let query = supabase.from(CLIENTS_TABLE).update({ active: false });

    // SEGURIDAD SaaS: Solo desactivar si pertenece al taller
    if (req.user.role !== 'SUPER_ADMIN') {
      query = query.eq('workshop_id', req.user.workshop_id);
    }

    const { error } = await query.eq('id', req.params.id);

    if (error) throw error;
    res.json({ ok: true, message: 'Cliente desactivado del sistema.' });
  } catch (err) {
    next(err);
  }
};
