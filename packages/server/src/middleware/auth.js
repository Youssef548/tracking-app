const jwt = require('jsonwebtoken');
const User = require('../models/User');

async function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: { message: 'No token provided', code: 'NO_TOKEN' } });
  }
  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: { message: 'User not found', code: 'USER_NOT_FOUND' } });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: { message: 'Invalid token', code: 'INVALID_TOKEN' } });
  }
}

module.exports = auth;
