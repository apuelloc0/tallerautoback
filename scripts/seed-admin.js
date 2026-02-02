/**
 * Crear usuario inicial (DIRECTORA).
 * Ejecutar: node scripts/seed-admin.js
 * Requiere MONGODB_URI y variables en .env
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import { ROLES } from '../src/config/constants.js';

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const exists = await User.findOne({ username: 'admin' });
  if (exists) {
    console.log('Ya existe un usuario admin.');
    await mongoose.disconnect();
    process.exit(0);
  }
  await User.create({
    username: 'admin',
    password: 'admin123',
    fullName: 'Administradora',
    role: ROLES.DIRECTORA,
    securityQuestions: [
      { question: '¿Nombre de su mascota?', answer: 'respuesta1' },
      { question: '¿Ciudad de nacimiento?', answer: 'respuesta2' },
    ],
  });
  console.log('Usuario admin creado. Usuario: admin, Contraseña: admin123');
  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
