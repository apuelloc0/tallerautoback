import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Usaremos el Service Role Key en el backend para tener acceso administrativo
// Estas variables deben estar en tu archivo .env
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('❌ Error fatal: SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no están definidas en el archivo .env');
}

const supabase = createClient(supabaseUrl, supabaseKey);
console.log('✅ Cliente de Supabase inicializado correctamente.');

export default supabase;
