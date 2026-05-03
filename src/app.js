
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

// IMPORTANTE para Render/Heroku: Confía en el proxy para obtener la IP real del cliente
app.set('trust proxy', 1);

app.use(helmet({ contentSecurityPolicy: false }));

// Configuración de CORS restringida para producción
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [process.env.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:8080', 'https://tallerautofront.pages.dev'].filter(Boolean);
    
    // Permitir: 1. Sin origen (Server-to-server) 2. Lista blanca 3. Subdominios de Cloudflare (.pages.dev)
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.pages.dev')) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
 
// Configuración de seguridad: Limitador de peticiones para producción
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 2000, // Muy elevado para que nadie sea bloqueado durante pruebas o uso normal
  message: { ok: false, message: 'Nuestros servidores están experimentando una alta demanda. Por favor, inténtelo de nuevo en unos minutos.' }
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
