const jwt = require('jsonwebtoken');

/**
 * Middleware: валидирует NextAuth JWT токен.
 * NextAuth по умолчанию подписывает токен тем же NEXTAUTH_SECRET,
 * поэтому бэкенд может проверять его без отдельного ключа.
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: no token' });
  }

  const token = authHeader.slice(7);
  try {
    // NextAuth JWT использует алгоритм HS256 с NEXTAUTH_SECRET
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET, {
      algorithms: ['HS256'],
    });
    // Кладём данные пользователя в req.user
    req.user = {
      id: decoded.sub || decoded.id,
      email: decoded.email,
      name: decoded.name,
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: invalid token' });
  }
}

module.exports = { requireAuth };
