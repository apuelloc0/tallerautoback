import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Usaremos el Service Role Key en el backend para tener acceso administrativo
// Estas variables deben estar en tu archivo .env
const supabaseUrl = process.env.SUPABASE_URL;

// IMPORTANTE: Asegúrate de que esta sea la "service_role" y NO la "anon" key.
// La service_role key salta automáticamente todas las políticas de RLS.
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('❌ Error fatal: SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no están definidas en el archivo .env');
}

// Validación para asegurar que la llave sea de service_role (Admin)
const isServiceKey = (key) => {
  try {
    // Decodifica el payload (segunda parte del JWT)
    const payload = JSON.parse(Buffer.from(key.split('.')[1], 'base64').toString());
    return payload.role === 'service_role';
  } catch (e) {
    return false;
  }
};

const isAdmin = isServiceKey(supabaseKey);
const supabase = createClient(supabaseUrl, supabaseKey);

console.log(`✅ Cliente de Supabase inicializado (Modo: ${isAdmin ? 'ADMIN/BYPASS_RLS' : 'RESTRINGIDO/ANON'}).`);

export default supabase;
