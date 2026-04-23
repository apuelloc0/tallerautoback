import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

import { notFound, errorHandler } from './middleware/errorHandler.js';

import apiRouter from './routes/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ 
  origin: [process.env.FRONTEND_URL, 'http://localhost:5173'].filter(Boolean), 
  credentials: true 
}));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
 
// Configuración de seguridad: Limitador de peticiones para producción
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Limita cada IP a 100 peticiones por ventana
  message: { ok: false, message: 'Demasiadas peticiones desde esta IP, por favor intente de nuevo más tarde.' }
});

const uploadsPath = process.env.UPLOAD_PATH || path.join(__dirname, '..', 'uploads');
app.use('/uploads', express.static(uploadsPath));

app.get('/health', (req, res) => {
  res.json({ ok: true, message: 'API Taller Mecánico - Supabase' });
});

app.use('/api', limiter, apiRouter);

app.use(notFound);
app.use(errorHandler);

export default app;
