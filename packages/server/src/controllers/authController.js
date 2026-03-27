const jwt = require('jsonwebtoken');
const User = require('../models/User');

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '7d';

function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: { message: 'Email already registered', code: 'EMAIL_EXISTS' } });
    }
    const user = await User.create({ name, email, password });
    const token = generateToken(user._id);
    res.status(201).json({ token, user });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: { message: 'Invalid email or password', code: 'INVALID_CREDENTIALS' } });
    }
    const token = generateToken(user._id);
    res.json({ token, user });
  } catch (err) {
    next(err);
  }
}

async function getMe(req, res) {
  res.json({ user: req.user });
}

async function updateProfile(req, res, next) {
  try {
    const { name, email, currentPassword, password } = req.body;
    const user = req.user;

    if (name !== undefined) {
      user.name = name.trim();
    }

    if (email !== undefined && email.toLowerCase() !== user.email) {
      const taken = await User.findOne({ email: email.toLowerCase(), _id: { $ne: user._id } });
      if (taken) {
        return res.status(409).json({ error: { message: 'Email already in use', code: 'EMAIL_TAKEN' } });
      }
      user.email = email.toLowerCase();
    }

    if (password !== undefined) {
      if (!currentPassword) {
        return res.status(400).json({ error: { message: 'Current password is required', code: 'MISSING_CURRENT_PASSWORD' } });
      }
      const correct = await user.comparePassword(currentPassword);
      if (!correct) {
        return res.status(400).json({ error: { message: 'Current password is incorrect', code: 'WRONG_PASSWORD' } });
      }
      user.password = password;
    }

    await user.save();
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, getMe, updateProfile };
