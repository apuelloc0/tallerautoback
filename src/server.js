import 'dotenv/config';
import connectDB from './config/db.js';
import app from './app.js';

const PORT = process.env.PORT || 4000;
const init = async () => {
  try {
    await connectDB()
    app.listen(PORT)
    console.log(`Servidor en http://localhost:${PORT}`);
  } catch (error) {
    console.log('Error Iniciando sistema', error);
  }
}

init()

