import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';

// Inicialización directa para uso en script
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  // Generamos una licencia segura de 32 caracteres (16 bytes hex)
  const code = randomBytes(16).toString('hex').toUpperCase();

  const { data, error } = await supabase
    .from('invitation_codes')
    .insert([{ code, is_used: false }])
    .select()
    .single();

  if (error) {
    console.error('❌ Error al generar código:', error.message);
    process.exit(1);
  }

  console.log('\n=============================================');
  console.log('✅ CLAVE DE PROPIETARIO GENERADA EXITOSAMENTE');
  console.log(`🔑 Código: ${data.code}`);
  console.log('=============================================\n');
}

run();