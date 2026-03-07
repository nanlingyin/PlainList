/**
 * JWT authentication middleware
 */
const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'fallback-secret';

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, SECRET);
    req.user = { id: payload.id, username: payload.username, isAdmin: payload.isAdmin };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function signToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, isAdmin: !!user.is_admin },
    SECRET,
    { expiresIn: '7d' }
  );
}

module.exports = { authMiddleware, signToken };
