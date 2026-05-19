const { query } = require('../config/db');

/**
 * Inyecta el usuario actual en la sesión de PostgreSQL
 * para que los triggers de bitácora puedan leerlo con
 * current_setting('app.current_user_id')
 */
const loggerMiddleware = async (req, res, next) => {
  if (req.user?.usuario_id) {
    try {
      await query(`SELECT set_config('app.current_user_id', $1, TRUE)`,
                  [String(req.user.usuario_id)]);
    } catch (_) { /* no bloquear la request si falla */ }
  }
  next();
};

module.exports = loggerMiddleware;
