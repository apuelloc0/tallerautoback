import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

import { notFound, errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import receiptRoutes from './routes/receiptRoutes.js';
import gradeRoutes from './routes/gradeRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import backupRoutes from './routes/backupRoutes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { ok: false, message: 'Demasiadas solicitudes. Intente más tarde.' },
});

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(limiter);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

const uploadsPath = process.env.UPLOAD_PATH || path.join(__dirname, '..', 'uploads');
app.use('/uploads', express.static(uploadsPath));

app.get('/health', (req, res) => {
  res.json({ ok: true, message: 'API estudiantes' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/backups', backupRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
