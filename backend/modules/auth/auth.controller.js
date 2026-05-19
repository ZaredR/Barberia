const authService    = require('./auth.service');
const { ok, error }  = require('../../utils/response');

const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return error(res, 'username y password son requeridos', 400);

    const data = await authService.login(username, password);
    return ok(res, data, 'Login exitoso');
  } catch (err) { next(err); }
};

const logout = async (req, res, next) => {
  try {
    await authService.logout(req.user.usuario_id);
    return ok(res, null, 'Sesión cerrada');
  } catch (err) { next(err); }
};

const me = (req, res) => ok(res, req.user, 'Usuario autenticado');

module.exports = { login, logout, me };
