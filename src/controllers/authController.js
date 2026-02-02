import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

const generateToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

export const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username, active: true });
    if (!user) {
      return res.status(401).json({ ok: false, message: 'Usuario o contraseña incorrectos.' });
    }
    const valid = await user.comparePassword(password);
    if (!valid) {
      return res.status(401).json({ ok: false, message: 'Usuario o contraseña incorrectos.' });
    }
    const token = generateToken(user._id);
    res.json({
      ok: true,
      message: 'Sesión iniciada.',
      token,
      user: user.toJSON(),
    });
  } catch (err) {
    next(err);
  }
};

export const me = async (req, res, next) => {
  try {
    res.json({ ok: true, user: req.user });
  } catch (err) {
    next(err);
  }
};

/** Recuperación: verificar preguntas de seguridad y devolver token para reset */
export const forgotPassword = async (req, res, next) => {
  try {
    const { username, answers } = req.body; // answers: [{ index, answer }, ...]
    const user = await User.findOne({ username, active: true });
    if (!user) {
      return res.status(404).json({ ok: false, message: 'Usuario no encontrado.' });
    }
    if (!user.securityQuestions?.length) {
      return res.status(400).json({ ok: false, message: 'No hay preguntas de seguridad configuradas.' });
    }
    const normalized = (s) => String(s || '').toLowerCase().trim();
    const allMatch = answers?.every(
      (a) =>
        user.securityQuestions[a.index] &&
        normalized(user.securityQuestions[a.index].answer) === normalized(a.answer)
    );
    if (!allMatch || answers?.length !== user.securityQuestions.length) {
      return res.status(401).json({ ok: false, message: 'Respuestas incorrectas.' });
    }
    const resetToken = jwt.sign(
      { userId: user._id, purpose: 'reset' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
    res.json({
      ok: true,
      message: 'Verificación correcta. Use el token para restablecer contraseña.',
      resetToken,
    });
  } catch (err) {
    next(err);
  }
};

/** Restablecer contraseña con token de recuperación */
export const resetPassword = async (req, res, next) => {
  try {
    const { resetToken, newPassword } = req.body;
    if (!resetToken || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ ok: false, message: 'Token y nueva contraseña (mín. 6 caracteres) requeridos.' });
    }
    const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    if (decoded.purpose !== 'reset') {
      return res.status(400).json({ ok: false, message: 'Token inválido.' });
    }
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ ok: false, message: 'Usuario no encontrado.' });
    }
    user.password = newPassword;
    await user.save();
    res.json({ ok: true, message: 'Contraseña actualizada correctamente.' });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(400).json({ ok: false, message: 'El enlace de recuperación ha expirado.' });
    }
    next(err);
  }
};
