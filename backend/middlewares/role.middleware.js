const { error } = require('../utils/response');

/**
 * Uso: roleMiddleware('admin')
 *      roleMiddleware('admin', 'recepcionista')
 */
const roleMiddleware = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.user) return error(res, 'No autenticado', 401);

    if (!rolesPermitidos.includes(req.user.rol)) {
      return error(res, 'No tienes permisos para esta acción', 403);
    }
    next();
  };
};

module.exports = roleMiddleware;
