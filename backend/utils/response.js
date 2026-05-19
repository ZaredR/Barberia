/**
 * Respuesta exitosa estándar
 */
const ok = (res, data = null, message = 'OK', statusCode = 200) => {
  return res.status(statusCode).json({ success: true, message, data });
};

/**
 * Respuesta de error estándar
 */
const error = (res, message = 'Error interno', statusCode = 500, errors = null) => {
  return res.status(statusCode).json({ success: false, message, errors });
};

module.exports = { ok, error };
