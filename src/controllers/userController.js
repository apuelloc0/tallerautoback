import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import { ROLES } from '../config/constants.js';

export const list = async (req, res, next) => {
  try {
    const users = await User.find({ active: { $ne: false } }).sort({ createdAt: -1 });
    res.json({ ok: true, data: users });
  } catch (err) {
    next(err);
  }
};

export const getOne = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ ok: false, message: 'Usuario no encontrado.' });
    }
    res.json({ ok: true, data: user.toJSON() });
  } catch (err) {
    next(err);
  }
};

export const verifyUsername = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username, active: { $ne: false } });
    if (!user) {
      return res.status(404).json({ ok: false, message: 'Usuario no encontrado.' });
    }
    const securityQuestions = (user.securityQuestions || []).map((q) => ({ question: q.question }));
    res.json({ ok: true, userId: user._id, securityQuestions });
  } catch (err) {
    next(err);
  }
};

export const verifySecurityAnswers = async (req, res, next) => {
  try {
    const user = await User.findById(req.body.userId);
    if (!user) {
      return res.status(404).json({ ok: false, message: 'Usuario no encontrado.' });
    }
    if (user.active === false) {
      return res.status(401).json({ ok: false, message: 'Cuenta no disponible.' });
    }
    const normalized = (s) => String(s || '').toLowerCase().trim();
    const allMatch = req.body.answers.every(
      (a) =>
        user.securityQuestions[a.index] &&
        normalized(user.securityQuestions[a.index].answer) === normalized(a.answer)
    );
    if (!allMatch || req.body.answers.length !== user.securityQuestions.length) {
      return res.status(401).json({ ok: false, message: 'Respuestas incorrectas.' });
    }
    const resetToken = jwt.sign(
      { userId: user._id, purpose: 'reset' },
      process.env.JWT_SECRET,
      { expiresIn: '5m' }
    );
    // Save the reset token in the database
    user.resetToken = resetToken;
    await user.save();

    res.json({ ok: true, message: 'Respuestas correctas.', resetToken: resetToken });
  } catch (err) {
    next(err);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.body.userId);
    if (!user) {
      return res.status(404).json({ ok: false, message: 'Usuario no encontrado.' });
    }
    if (user.active === false) {
      return res.status(400).json({ ok: false, message: 'Cuenta desactivada.' });
    }
    if (!user.resetToken) {
      return res.status(400).json({ ok: false, message: 'Token de restablecimiento de contraseña no válido.' });
    }
    const decoded = jwt.verify(user.resetToken, process.env.JWT_SECRET);
    if (decoded.purpose !== 'reset') {
      return res.status(400).json({ ok: false, message: 'Token de restablecimiento de contraseña no válido.' });
    }
    user.password = req.body.newPassword;
    user.resetToken = null;
    await user.save();
    res.json({ ok: true, message: 'Contraseña restablecida.' });
  } catch (err) {
    next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.status(201).json({ ok: true, data: user.toJSON(), message: 'Usuario creado.' });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ ok: false, message: 'El nombre de usuario ya existe.' });
    }
    next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ ok: false, message: 'Usuario no encontrado.' });
    }
    if (req.body.active === false && String(user._id) === String(req.user._id)) {
      return res.status(400).json({
        ok: false,
        message: 'No puede desactivar su propia cuenta.',
      });
    }
    if (user.role === ROLES.DIRECTORA && user.active !== false) {
      const directorsActive = await User.countDocuments({ role: ROLES.DIRECTORA, active: { $ne: false } });
      if (directorsActive <= 1) {
        if (req.body.role != null && req.body.role !== ROLES.DIRECTORA) {
          return res.status(400).json({
            ok: false,
            message: 'Debe existir al menos una usuaria con rol Directora activa.',
          });
        }
        if (req.body.active === false) {
          return res.status(400).json({
            ok: false,
            message: 'No se puede desactivar la única Directora activa.',
          });
        }
      }
    }
    const allowed = ['username', 'fullName', 'role', 'active', 'securityQuestions'];
    if (req.body.password && req.body.password.length >= 6) {
      user.password = req.body.password;
    }
    allowed.forEach((k) => {
      if (req.body[k] !== undefined) user[k] = req.body[k];
    });
    await user.save();
    res.json({ ok: true, data: user.toJSON(), message: 'Usuario actualizado.' });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ ok: false, message: 'El nombre de usuario ya existe.' });
    }
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ ok: false, message: 'Usuario no encontrado.' });
    }
    if (user.role === ROLES.DIRECTORA && user.active !== false) {
      const directorsActive = await User.countDocuments({ role: ROLES.DIRECTORA, active: { $ne: false } });
      if (directorsActive <= 1) {
        return res.status(400).json({
          ok: false,
          message: 'No se puede eliminar la única Directora activa.',
        });
      }
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ ok: true, message: 'Usuario eliminado.' });
  } catch (err) {
    next(err);
  }
};
