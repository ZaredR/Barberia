const { verifyToken } = require('../utils/jwt');
const { error }       = require('../utils/response');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return error(res, 'Token requerido', 401);
  }

  const token = authHeader.split(' ')[1];
  try {
    req.user = verifyToken(token);
    next();
  } catch (err) {
    return error(res, 'Token inválido o expirado', 401);
  }
};

module.exports = authMiddleware;
