const jwt = require('jsonwebtoken');

/**
 * @description Middleware de autenticación JWT. Verifica token en el header Authorization.
 * Inyecta req.user = { userId, companyId, role } para uso en controladores y middlewares siguientes.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Token de autenticación requerido.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Token inválido o expirado.' });
  }
};

/**
 * @description Middleware de autorización por rol. Uso: authorize('owner', 'admin').
 * Debe usarse siempre DESPUÉS de authenticate.
 * @param {...string} roles - Roles permitidos
 * @returns {import('express').RequestHandler}
 */
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return res.status(403).json({ success: false, message: 'No tienes permisos para esta acción.' });
  }
  next();
};

module.exports = { authenticate, authorize };
