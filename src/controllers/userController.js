import User from '../models/User.js';

export const list = async (req, res, next) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
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
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ ok: false, message: 'Usuario no encontrado.' });
    }
    res.json({ ok: true, message: 'Usuario eliminado.' });
  } catch (err) {
    next(err);
  }
};
