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
