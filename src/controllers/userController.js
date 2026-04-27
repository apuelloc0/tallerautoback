import supabase from '../config/db.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { ROLES } from '../config/constants.js';

export const list = async (req, res, next) => {
  try {
    const userRole = String(req.user.role || '').toUpperCase();
    let query = supabase.from('users').select('*');

    // SEGURIDAD SaaS: Si NO es Super Admin, filtrar obligatoriamente por su taller
    if (userRole === 'SUPER_ADMIN') {
      const filterWsId = req.query.workshopId || req.query.workshop_id;
      // El Super Admin en la lista general solo ve a otros Super Admins (lo que le compete)
      // o filtra por taller si está realizando una auditoría.
      query = filterWsId ? query.eq('workshop_id', filterWsId) : query.eq('role', 'SUPER_ADMIN');
    } else if (userRole !== 'GOD_MODE') {
      if (!req.user.workshop_id) return res.status(403).json({ ok: false, message: 'No tienes un taller asociado.' });
      query = query.eq('workshop_id', req.user.workshop_id);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
};

export const getOne = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !data) {
      return res.status(404).json({ ok: false, message: 'Usuario no encontrado.' });
    }

    // SEGURIDAD SaaS: No permitir ver usuarios de otros talleres
    if (req.user.role !== 'SUPER_ADMIN' && data.workshop_id !== req.user.workshop_id) {
      return res.status(403).json({ ok: false, message: 'No tienes permiso para ver este usuario.' });
    }

    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
};

export const verifyUsername = async (req, res, next) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, security_questions, active')
      .ilike('username', req.params.username)
      .single();

    if (error || !user) {
      return res.status(404).json({ ok: false, message: 'Usuario no encontrado.' });
    }

    if (!user.active) {
      return res.status(403).json({ ok: false, message: 'Tu cuenta aún no ha sido aprobada por el administrador.' });
    }

    const questions = (user.security_questions || []).map((q) => ({ question: q.question }));
    res.json({ ok: true, userId: user.id, securityQuestions: questions });
  } catch (err) {
    next(err);
  }
};

export const verifySecurityAnswers = async (req, res, next) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.body.userId)
      .single();

    if (error || !user) {
      return res.status(404).json({ ok: false, message: 'Usuario no encontrado.' });
    }

    const normalized = (s) => String(s || '').toLowerCase().trim();
    const allMatch = req.body.answers.every(
      (a) =>
        user.security_questions[a.index] &&
        normalized(user.security_questions[a.index].answer) === normalized(a.answer)
    );
    if (!allMatch || req.body.answers.length !== user.security_questions.length) {
      return res.status(401).json({ ok: false, message: 'Respuestas incorrectas.' });
    }
    const resetToken = jwt.sign(
      { userId: user.id, purpose: 'reset' },
      process.env.JWT_SECRET,
      { expiresIn: '5m' }
    );

    await supabase.from('users').update({ reset_token: resetToken }).eq('id', user.id);

    res.json({ ok: true, message: 'Respuestas correctas.', resetToken: resetToken });
  } catch (err) {
    next(err);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.body.userId)
      .single();

    if (error || !user) {
      return res.status(404).json({ ok: false, message: 'Usuario no encontrado.' });
    }

    if (!user.reset_token) {
      return res.status(400).json({ ok: false, message: 'Token de restablecimiento de contraseña no válido.' });
    }
    const decoded = jwt.verify(user.reset_token, process.env.JWT_SECRET);
    if (decoded.purpose !== 'reset') {
      return res.status(400).json({ ok: false, message: 'Token de restablecimiento de contraseña no válido.' });
    }

    const hashedPassword = await bcrypt.hash(req.body.newPassword, 12);
    
    const { error: updateError } = await supabase
      .from('users')
      .update({ password: hashedPassword, reset_token: null })
      .eq('id', user.id);

    if (updateError) throw updateError;

    res.json({ ok: true, message: 'Contraseña restablecida.' });
  } catch (err) {
    next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    const userData = { ...req.body };
    
    // SEGURIDAD SaaS: Forzar que el nuevo usuario pertenezca al taller del creador
    if (req.user?.workshop_id && !userData.workshop_id) {
      userData.workshop_id = req.user.workshop_id;
    }

    if (userData.password) {
      userData.password = await bcrypt.hash(userData.password, 12);
    }

    const { data, error } = await supabase.from('users').insert([userData]).select().single();
    if (error) throw error;
    const { password: _, ...userWithoutPassword } = data;
    res.status(201).json({ ok: true, data: userWithoutPassword, message: 'Usuario creado.' });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ ok: false, message: 'El nombre de usuario ya existe.' });
    }
    next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !user) {
      return res.status(404).json({ ok: false, message: 'Usuario no encontrado.' });
    }
    
    // SEGURIDAD SaaS: Impedir modificar usuarios que no pertenezcan al mismo taller
    if (req.user.role !== 'SUPER_ADMIN' && user.workshop_id !== req.user.workshop_id) {
      return res.status(403).json({ ok: false, message: 'Acceso denegado a este taller.' });
    }

    // SEGURIDAD: Protección del último SUPER_ADMIN global
    if (user.role === 'SUPER_ADMIN' && (req.body.active === false || (req.body.role && req.body.role !== 'SUPER_ADMIN'))) {
      const { count } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'SUPER_ADMIN')
        .eq('active', true);

      if (count <= 1) {
        return res.status(400).json({ ok: false, message: 'No se puede desactivar o degradar al último Super Administrador de la plataforma.' });
      }
    }

    // Impedir autodesactivación
    if (req.body.active === false && user.id === req.user.id) {
      return res.status(400).json({ ok: false, message: 'No puede desactivar su propia cuenta.' });
    }
    
    // SEGURIDAD SAAS: Solo un SUPER_ADMIN puede asignar el rol SUPER_ADMIN
    if (req.body.role === 'SUPER_ADMIN' && req.user?.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        ok: false,
        message: 'No tiene permisos para asignar el rol de Super Administrador.',
      });
    }

    // Aseguramos que ROLES esté definido o usamos el string directo 'ADMINISTRADOR'
    const adminRole = ROLES?.ADMINISTRADOR || 'ADMINISTRADOR';
    if (user.role === adminRole && user.active !== false) {
      const { count } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', adminRole)
        .eq('workshop_id', user.workshop_id) // Filtro por taller
        .eq('active', true);

      if (count <= 1) {
        if (req.body.role != null && req.body.role !== adminRole) {
          return res.status(400).json({
            ok: false,
            message: 'Debe existir al menos un usuario con rol Administrador activo.',
          });
        }
        if (req.body.active === false) {
          return res.status(400).json({
            ok: false,
            message: 'No se puede desactivar al único Administrador activo.',
          });
        }
      }
    }

    const updateData = { ...req.body };
    if (updateData.password && updateData.password.length >= 6) {
      updateData.password = await bcrypt.hash(updateData.password, 12);
    }

    const { data: updated, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', req.params.id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }
    
    const { password: _, ...updatedWithoutPassword } = updated;
    res.json({ ok: true, data: updatedWithoutPassword, message: 'Usuario actualizado.' });
  } catch (err) {
    console.error('❌ [USER_UPDATE] Excepción crítica:', err);
    if (err.code === '23505') {
      return res.status(400).json({ ok: false, message: 'Este correo electrónico ya está en uso por otro usuario.' });
    }
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !user) {
      return res.status(404).json({ ok: false, message: 'Usuario no encontrado.' });
    }

    // SEGURIDAD SaaS: Impedir eliminar usuarios de otros talleres
    if (req.user.role !== 'SUPER_ADMIN' && user.workshop_id !== req.user.workshop_id) {
      return res.status(403).json({ ok: false, message: 'No tienes permisos para eliminar este usuario.' });
    }

    // SEGURIDAD: Protección del último SUPER_ADMIN global
    if (user.role === 'SUPER_ADMIN') {
      const { count } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'SUPER_ADMIN');
      if (count <= 1) {
        return res.status(400).json({ ok: false, message: 'No se puede eliminar al último Super Administrador de la plataforma.' });
      }
    }

    // LÓGICA DE TALLER: Si es el último administrador del taller
    const adminRole = ROLES?.ADMINISTRADOR || 'ADMINISTRADOR';
    if (user.role === adminRole) {
      const { count: adminCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', adminRole)
        .eq('workshop_id', user.workshop_id) // Filtro por taller
        .eq('active', true);

      if (adminCount <= 1) {
        // Eliminar a todos los empleados de ese taller
        await supabase.from('users').delete().eq('workshop_id', user.workshop_id);
        // Eliminar el taller
        await supabase.from('workshops').delete().eq('id', user.workshop_id);
        return res.json({ ok: true, message: 'Taller y personal eliminados al remover al último administrador.' });
      }
    }

    await supabase.from('users').delete().eq('id', req.params.id);
    res.json({ ok: true, message: 'Usuario eliminado.' });
  } catch (err) {
    next(err);
  }
};
