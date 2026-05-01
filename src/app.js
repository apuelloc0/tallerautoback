import "./config/sentry.js"; // Creamos este archivo para mantener app.js limpio
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
  // Permite solo tu dominio de producción y localhost para desarrollo
  origin: [process.env.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:8080', 'https://tallerautofront.pages.dev'].filter(Boolean),
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

// Snippet de Sentry para verificar la integración
app.get("/debug-sentry", function mainHandler(req, res) {
  throw new Error("My first Sentry error!");
});

app.use('/api', limiter, apiRouter);

// El manejador de errores de Sentry debe ir DESPUÉS de todas las rutas
// y ANTES de tus otros middlewares de manejo de errores (notFound, errorHandler).
import * as Sentry from "@sentry/node";
Sentry.setupExpressErrorHandler(app);

app.use(notFound);
app.use(errorHandler);

export default app;
