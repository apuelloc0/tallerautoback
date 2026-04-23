import supabase from '../config/db.js';
import { WORKSHOP_CONFIG_TABLE } from '../models/WorkshopConfig.js';
import { getPublicPath } from '../config/upload.js';

export const DEFAULT_GENERAL = {
  workshop_name: 'AutoTaller',
  rif: 'J-12345678-9',
  address: 'Av. Principal, Sector Centro',
  city: 'Caracas',
  phone: '0412-1234567',
  email: 'contacto@institucion.edu.ve',
  logo_url: '',
  hour_rate_usd: 0,
  tax_percentage: 16,
  currency_rate_usd_ves: null,
};

function normalizeRate(v) {
  if (v === '' || v === null || v === undefined) return null;
  const n = typeof v === 'number' ? v : Number(String(v).replace(',', '.'));
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

function buildGeneralPayload(body = {}) {
  return {
    workshop_name: String(body.workshop_name ?? DEFAULT_GENERAL.workshop_name).trim(),
    rif: String(body.rif ?? '').trim(),
    phone: String(body.phone ?? '').trim(),
    email: String(body.email ?? '').trim(),
    address: String(body.address ?? '').trim(),
    city: String(body.city ?? DEFAULT_GENERAL.city).trim(),
    logo_url: String(body.logo_url ?? '').trim(),
    hour_rate_usd: normalizeRate(body.hour_rate_usd) || 0,
    tax_percentage: normalizeRate(body.tax_percentage) || 16,
    currency_rate_usd_ves: normalizeRate(body.currency_rate_usd_ves),
  };
}

export const getPublicInfo = async (req, res, next) => {
  try {
    const { data: general, error } = await supabase
      .from(WORKSHOP_CONFIG_TABLE)
      .select('*')
      .eq('id', 1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    const config = general || DEFAULT_GENERAL;
    res.json({
      ok: true,
      data: {
        workshop_name: config.workshop_name,
        rif: config.rif,
        currency_rate_usd_ves: config.currency_rate_usd_ves,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getConfig = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from(WORKSHOP_CONFIG_TABLE)
      .select('*')
      .eq('id', 1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    res.json({ ok: true, data: data || DEFAULT_GENERAL });
  } catch (err) {
    next(err);
  }
};

export const updateConfig = async (req, res, next) => {
  try {
    const { data: prev } = await supabase.from(WORKSHOP_CONFIG_TABLE).select('*').eq('id', 1).single();
    
    const body = req.body || {};
    const payload = buildGeneralPayload({
      ...(prev || DEFAULT_GENERAL),
      ...body,
      logo_url: body.logo_url !== undefined ? body.logo_url : (prev?.logo_url ?? ''),
    });

    const { error } = await supabase
      .from(WORKSHOP_CONFIG_TABLE)
      .upsert({ id: 1, ...payload, updated_at: new Date() });

    if (error) throw error;

    res.json({ ok: true, data: payload, message: 'Configuración general guardada.' });
  } catch (err) {
    next(err);
  }
};

/** Subir logo para reportes / cintillo. Actualiza general.logoUrl */
export const uploadLogo = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, message: 'Archivo de imagen requerido.' });
    }
    const url = getPublicPath(req, req.file);
    
    const { error } = await supabase
      .from(WORKSHOP_CONFIG_TABLE)
      .update({ logo_url: url, updated_at: new Date() })
      .eq('id', 1);

    if (error) throw error;
    res.json({ ok: true, data: { logo_url: url }, message: 'Logo actualizado.' });
  } catch (err) {
    next(err);
  }
};
