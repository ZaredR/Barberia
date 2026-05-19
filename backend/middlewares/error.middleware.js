const { error } = require('../utils/response');

// eslint-disable-next-line no-unused-vars
const errorMiddleware = (err, req, res, next) => {
  console.error('💥 Error no manejado:', err);

  // Error de constraint de PostgreSQL (duplicados, FK, etc.)
  if (err.code === '23505') return error(res, 'Registro duplicado', 409);
  if (err.code === '23503') return error(res, 'Referencia a registro inexistente', 400);
  if (err.code === '23514') return error(res, 'Valor fuera del rango permitido', 400);

  return error(res, err.message || 'Error interno del servidor', err.status || 500);
};

module.exports = errorMiddleware;
