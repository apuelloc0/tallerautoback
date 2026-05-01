import supabase from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { validateAndUseCode } from './invitationController.js';

/**
 * Helper para validar el token de Cloudflare Turnstile (Protección contra bots)
 */
const verifyBotProtection = async (token) => {
  if (!token) return false;
  try {
    const formData = new URLSearchParams();
    formData.append('secret', process.env.TURNSTILE_SECRET_KEY);
    formData.append('response', token);

    const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    });
    const outcome = await result.json();
    return outcome.success;
  } catch (err) {
    console.error('[SECURITY] Turnstile verification error:', err);
    return false;
  }
};

/**
 * Registro de un nuevo Dueño de Taller usando una Licencia SaaS.
 */
export const registerWorkshopOwner = async (req, res, next) => {
  try {
    const { username, password, full_name, workshop_name, license_code, security_questions, captchaToken } = req.body;

    // Validación de Bot en producción
    if (process.env.NODE_ENV === 'production' && process.env.ENABLE_TURNSTILE === 'true') { // <-- CAMBIO AQUÍ
      const isHuman = await verifyBotProtection(captchaToken);
      if (!isHuman) return res.status(400).json({ ok: false, message: 'Fallo en verificación de seguridad. Intente de nuevo.' });
    }

    if (!license_code) {
      return res.status(400).json({ ok: false, message: 'Se requiere una licencia válida para registrar un taller.' });
    }

    // 1. Comprobar disponibilidad de la licencia inicialmente
    const { data: licenseCheck } = await supabase
      .from('invitation_codes')
      .select('is_used')
      .eq('code', license_code)
      .single();

    if (!licenseCheck || licenseCheck.is_used) {
      return res.status(400).json({ ok: false, message: 'La licencia no es válida o ya ha sido utilizada.' });
    }

    // 2. Crear el Taller
    // Generamos dos join_codes únicos (Técnico y Recepción)
    let joinCodeTech, joinCodeRecep;
    let isUnique = false;
    let attempts = 0;
    const prefix = workshop_name.substring(0, 3).toUpperCase().padEnd(3, 'X');

    while (!isUnique && attempts < 5) {
      // Generamos números aleatorios independientes para cada rol para que no sean deducibles
      const randomTech = Math.floor(100000 + Math.random() * 900000);
      const randomRecep = Math.floor(100000 + Math.random() * 900000);
      
      const tempTech = `${prefix}-${randomTech}-T`;
      const tempRecep = `${prefix}-${randomRecep}-R`;

      // Verificamos que ninguno de los dos exista
      const { data: existingWorkshop } = await supabase
        .from('workshops')
        .select('id')
        .or(`join_code_tech.eq.${tempTech},join_code_recep.eq.${tempRecep}`)
        .maybeSingle();

      if (!existingWorkshop) {
        joinCodeTech = tempTech;
        joinCodeRecep = tempRecep;
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return res.status(500).json({ ok: false, message: 'Error de servidor: No se pudo generar un código único para el taller.' });
    }

    const { data: workshop, error: workshopError } = await supabase
      .from('workshops')
      .insert([{ 
        name: workshop_name, 
        payment_status: 'active', 
        subscription_plan: 'pro',
        join_code_tech: joinCodeTech,
        join_code_recep: joinCodeRecep
      }])
      .select()
      .single();

    if (workshopError) throw workshopError;

    // Intentar crear el usuario. Si falla, deberíamos idealmente revertir el taller
    // (En un MVP, esto es suficiente con el manejo de errores global)
    // 3. Crear el Usuario Dueño en la tabla de Auth
    const hashedPassword = await bcrypt.hash(password, 12);
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert([{
        username,
        full_name,
        password: hashedPassword,
        role: 'ADMINISTRADOR', // El dueño es Admin de su taller
        workshop_id: workshop.id,
        active: true,
        security_questions // Guardamos las preguntas de seguridad
      }])
      .select()
      .single();

    if (userError) throw userError;

    // 4. Consumir la licencia vinculándola al taller creado
    await validateAndUseCode(license_code, workshop.id);

    res.status(201).json({ 
      ok: true, 
      message: 'Taller y cuenta creados exitosamente.',
      join_code: joinCodeTech // Enviamos el de técnicos por defecto en el éxito
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Registro de un nuevo Empleado usando el Código de Unión del taller.
 */
export const registerEmployee = async (req, res, next) => {
  try {
    const { username, password, full_name, join_code, security_questions, captchaToken } = req.body;

    if (process.env.NODE_ENV === 'production' && process.env.ENABLE_TURNSTILE === 'true') { // <-- CAMBIO AQUÍ
      const isHuman = await verifyBotProtection(captchaToken);
      if (!isHuman) return res.status(400).json({ ok: false, message: 'Verificación de seguridad fallida.' });
    }

    if (!join_code) {
      return res.status(400).json({ ok: false, message: 'Se requiere el código de taller para unirse.' });
    }

    // 1. Buscar el taller verificando a qué código corresponde
    const { data: workshop, error: workshopError } = await supabase
      .from('workshops')
      .select('id, name, join_code_tech, join_code_recep')
      .or(`join_code_tech.eq.${join_code},join_code_recep.eq.${join_code}`)
      .single();

    if (workshopError || !workshop) {
      return res.status(404).json({ ok: false, message: 'Código de taller no válido.' });
    }

    // 2. Determinar el rol que IMPLICA el código de unión
    const determinedRole = join_code === workshop.join_code_tech ? 'TECNICO' : 'RECEPCIONISTA';

    // 3. Crear el Usuario Empleado
    const hashedPassword = await bcrypt.hash(password, 12);
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert([{
        username,
        full_name,
        password: hashedPassword,
        role: determinedRole, // Usamos el rol determinado por el código
        workshop_id: workshop.id,
        active: false,
        security_questions // Guardamos las preguntas de seguridad
      }])
      .select()
      .single();

    if (userError) throw userError;

    res.status(201).json({ 
      ok: true, 
      message: `Solicitud enviada. El administrador de ${workshop.name} debe aprobar tu cuenta antes de que puedas entrar.` 
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Despachador de registro genérico.
 * Decide si es registro de dueño o empleado según los datos recibidos.
 */
export const register = async (req, res, next) => {
  if (req.body.license_code) {
    return registerWorkshopOwner(req, res, next);
  } else if (req.body.join_code) {
    return registerEmployee(req, res, next);
  } else {
    return res.status(400).json({ 
      ok: false, 
      message: 'Faltan datos de registro (licencia para dueños o código de taller para empleados).' 
    });
  }
};

/**
 * Inicio de sesión (Login)
 */
export const login = async (req, res, next) => {
  try {
    const { username, password, captchaToken } = req.body;

    if (process.env.NODE_ENV === 'production' && process.env.ENABLE_TURNSTILE === 'true') { // <-- CAMBIO AQUÍ
      const isHuman = await verifyBotProtection(captchaToken);
      if (!isHuman) return res.status(400).json({ ok: false, message: 'Seguridad: Por favor verifique que no es un robot.' });
    }

    // 1. Buscar usuario y unir con la tabla workshops para traer el join_code
    const { data: user, error } = await supabase
      .from('users')
      .select(`
        *,
        workshops ( name, join_code_tech, join_code_recep, payment_status )
      `)
      .eq('username', username)
      .single();

    if (error || !user) {
      console.error('[LOGIN_ERROR] Usuario no encontrado:', username);
      return res.status(401).json({ ok: false, message: 'Credenciales inválidas.' });
    }

    // SEGURIDAD: Bloquear acceso si la cuenta está explícitamente desactivada
    // Si es null, permitimos el paso por ser cuenta antigua
    if (user.active === false || user.active === 'false') {
      return res.status(401).json({ 
        ok: false, 
        message: 'Tu cuenta está desactivada o pendiente de aprobación. Contacta al administrador.' 
      });
    }

    // SEGURIDAD SaaS: Bloquear acceso si el taller está suspendido por falta de pago o infracción
    if (user.role !== 'SUPER_ADMIN' && user.workshops?.payment_status === 'suspended') {
      return res.status(403).json({ 
        ok: false, 
        message: 'El acceso a este taller ha sido suspendido. Por favor, contacta al administrador de la plataforma.' 
      });
    }

    // 2. Verificar contraseña
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ ok: false, message: 'Credenciales inválidas.' });
    }

    // 3. Generar Token JWT
    const token = jwt.sign(
      { userId: user.id, workshop_id: user.workshop_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ 
      ok: true, 
      token, 
      user: { 
        id: user.id, 
        username: user.username, 
        role: user.role, 
        full_name: user.full_name, 
        workshop_id: user.workshop_id,
        join_code_tech: user.workshops?.join_code_tech || null,
        join_code_recep: user.workshops?.join_code_recep || null,
        workshop_name: user.workshops?.name || null
      } 
    });
  } catch (err) {
    next(err);
  }
};

/** Obtener datos del usuario actual autenticado */
export const me = async (req, res) => {
  res.json({ ok: true, user: req.user });
};