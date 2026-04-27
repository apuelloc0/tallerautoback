import supabase from '../config/db.js';

/** Listar todos los repuestos */
export const list = async (req, res, next) => {
  try {
    let query = supabase.from('inventory').select('*');

    // SEGURIDAD SaaS: Filtrar por taller
    if (req.user.role !== 'SUPER_ADMIN') {
      query = query.eq('workshop_id', req.user.workshop_id);
    }

    const { data, error } = await query
      .order('name', { ascending: true });

    if (error) throw error;
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
};

/** Crear un nuevo repuesto */
export const create = async (req, res, next) => {
  try {
    const { code, name, category, stock, minStock, price, currency } = req.body;
    const { data, error } = await supabase
      .from('inventory')
      .insert([{ 
        code, 
        name, 
        category, 
        currency: currency || 'COP',
        workshop_id: req.user.workshop_id,
        stock: parseInt(stock) || 0, 
        min_stock: parseInt(minStock ?? 5) || 0, 
        price_usd: parseFloat(price) || 0,
        created_at: new Date(),
        updated_at: new Date()
      }])
      .select()
      .single();

    if (error) {
      console.error('❌ Error de Supabase al crear repuesto:', error);
      return res.status(400).json({ ok: false, message: error.message });
    }
    res.status(201).json({ ok: true, data, message: 'Repuesto agregado.' });
  } catch (err) {
    next(err);
  }
};

/** Actualizar un repuesto existente */
export const update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { code, name, category, stock, minStock, price, currency } = req.body;
    
    // Construimos el objeto de actualización de forma segura para evitar NaN o undefined
    const updates = {};
    if (code !== undefined) updates.code = code;
    if (name !== undefined) updates.name = name;
    if (category !== undefined) updates.category = category;
    if (currency !== undefined) updates.currency = currency || 'COP';
    if (stock !== undefined) updates.stock = parseInt(stock) || 0;
    if (minStock !== undefined) updates.min_stock = parseInt(minStock) || 0;
    if (price !== undefined) updates.price_usd = parseFloat(price) || 0;
    
    updates.updated_at = new Date();

    let query = supabase.from('inventory').update(updates);

    if (req.user.role !== 'SUPER_ADMIN') {
      query = query.eq('workshop_id', req.user.workshop_id);
    }

    const { data, error } = await query
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Error de Supabase al actualizar repuesto:', error);
      return res.status(400).json({ ok: false, message: error.message });
    }
    res.json({ ok: true, data, message: 'Repuesto actualizado.' });
  } catch (err) {
    next(err);
  }
};

/** Eliminar un repuesto */
export const remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    let query = supabase.from('inventory').delete();

    if (req.user.role !== 'SUPER_ADMIN') {
      query = query.eq('workshop_id', req.user.workshop_id);
    }

    const { error } = await query.eq('id', id);

    if (error) throw error;
    res.json({ ok: true, message: 'Repuesto eliminado.' });
  } catch (err) {
    next(err);
  }
};
