import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
import { USERS_TABLE } from '../src/models/User.js';
import { ROLES } from '../src/config/constants.js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function seedAdmin() {
  console.log('🚀 Iniciando creación de usuario administrador en Supabase...');
  
  const username = 'admin';
  const password = 'adminpassword';
  const hashedPassword = await bcrypt.hash(password, 12);

  const { data, error } = await supabase
    .from(USERS_TABLE)
    .upsert([
      {
        username,
        password: hashedPassword,
        full_name: 'Administrador del Sistema',
        role: ROLES.ADMINISTRADOR,
        active: true,
      }
    ], { onConflict: 'username' });

  if (error) {
    console.error('❌ Error al crear admin:', error.message);
  } else {
    console.log('✅ Usuario admin creado/actualizado con éxito.');
  }
}

seedAdmin();