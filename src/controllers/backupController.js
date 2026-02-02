import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Backup from '../models/Backup.js';
import mongoose from 'mongoose';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Generar respaldo (exportar colecciones a JSON en una carpeta) */
export const createBackup = async (req, res, next) => {
  try {
    const collections = await mongoose.connection.db.listCollections().toArray();
    const backupDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const dirName = `backup-${timestamp}`;
    const fullPath = path.join(backupDir, dirName);
    fs.mkdirSync(fullPath, { recursive: true });

    for (const col of collections) {
      const name = col.name;
      const docs = await mongoose.connection.db.collection(name).find({}).toArray();
      const filePath = path.join(fullPath, `${name}.json`);
      fs.writeFileSync(filePath, JSON.stringify(docs, null, 2), 'utf8');
    }

    const backupRecord = new Backup({
      filename: dirName,
      path: fullPath,
      size: 0,
      createdBy: req.user?._id,
    });
    await backupRecord.save();

    res.json({
      ok: true,
      message: 'Respaldo creado correctamente.',
      data: { path: fullPath, name: dirName, id: backupRecord._id },
    });
  } catch (err) {
    next(err);
  }
};

export const listBackups = async (req, res, next) => {
  try {
    const list = await Backup.find({}).populate('createdBy', 'username fullName').sort({ createdAt: -1 }).lean();
    res.json({ ok: true, data: list });
  } catch (err) {
    next(err);
  }
};
