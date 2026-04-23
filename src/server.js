import 'dotenv/config';
import app from './app.js';

const PORT = process.env.PORT || 4000;

const init = async () => {
  try {
    app.listen(PORT, () => {
      console.log(`🚀 Servidor del Taller corriendo en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Error iniciando el sistema:', error);
  }
};

init();
