import supabase from '../config/db.js';

/** Listar vehículos (opcionalmente por cliente) */
export const list = async (req, res, next) => {
  try {
    const { clientId } = req.query;
    let query = supabase.from('vehicles').select('*, clients(first_name, last_name)');

    // SEGURIDAD SaaS
    if (req.user.role !== 'SUPER_ADMIN') {
      query = query.eq('workshop_id', req.user.workshop_id);
    }

    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;

    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
};

/** Obtener un vehículo por placa o ID */
export const getOne = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('vehicles')
      .select('*, clients(*)')
      .or(`id.eq.${id},plate.eq.${id}`)
      .single();

    // SEGURIDAD SaaS
    if (data && req.user.role !== 'SUPER_ADMIN' && data.workshop_id !== req.user.workshop_id) {
      return res.status(403).json({ ok: false, message: 'Acceso denegado' });
    }

    if (error || !data) return res.status(404).json({ ok: false, message: 'Vehículo no encontrado' });
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
};

/** Crear vehículo */
export const create = async (req, res, next) => {
  try {
    const vehicleData = { ...req.body, workshop_id: req.user.workshop_id };

    const { data, error } = await supabase
      .from('vehicles')
      .insert([vehicleData])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') return res.status(400).json({ ok: false, message: 'Esta placa ya está registrada' });
      throw error;
    }
    res.status(201).json({ ok: true, data, message: 'Vehículo registrado correctamente' });
  } catch (err) {
    next(err);
  }
};

/** Actualizar vehículo */
export const update = async (req, res, next) => {
  try {
    let query = supabase.from('vehicles').update(req.body);

    if (req.user.role !== 'SUPER_ADMIN') {
      query = query.eq('workshop_id', req.user.workshop_id);
    }

    const { data, error } = await query
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ ok: true, data, message: 'Datos del vehículo actualizados' });
  } catch (err) {
    next(err);
  }
};

/** Eliminar vehículo */
export const remove = async (req, res, next) => {
  try {
    let query = supabase.from('vehicles').delete();

    if (req.user.role !== 'SUPER_ADMIN') {
      query = query.eq('workshop_id', req.user.workshop_id);
    }

    const { error } = await query.eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true, message: 'Vehículo eliminado del sistema' });
  } catch (err) {
    next(err);
  }
};