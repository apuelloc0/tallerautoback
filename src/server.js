import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import app from './app.js';

const PORT = process.env.PORT || 4000;

async function dropLegacyIndexes() {
  try {
    const col = mongoose.connection.collection('students');
    const indexes = await col.indexes();
    for (const idx of indexes) {
      const keys = Object.keys(idx.key || {});
      if (idx.unique && keys.length === 1 && keys[0] === 'idNumber') {
        await col.dropIndex(idx.name);
        console.log('Indice unico legado de idNumber eliminado.');
      }
    }
  } catch {
    // Ignorar si el índice no existe
  }
}

const init = async () => {
  try {
    await connectDB();
    await dropLegacyIndexes();
    app.listen(PORT);
    console.log(`Servidor en http://localhost:${PORT}`);
  } catch (error) {
    console.log('Error Iniciando sistema', error);
  }
};

init();

