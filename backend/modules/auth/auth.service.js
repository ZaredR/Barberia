const db                          = require('../../config/db');
const { comparePassword }         = require('../../utils/bcrypt');
const { generateToken }           = require('../../utils/jwt');

const login = async (username, password) => {
  const { rows } = await db.query(
    `SELECT u.usuario_id, u.nombre, u.username, u.gmail,
            u.password_hash, u.activo, u.porcentaje_ganancia,
            r.descripcion_rol AS rol
     FROM usuario u
     JOIN rol r ON u.rol_id = r.rol_id
     WHERE u.username = $1`,
    [username]
  );

  const user = rows[0];
  if (!user)               throw { status: 401, message: 'Credenciales incorrectas' };
  if (!user.activo)        throw { status: 403, message: 'Usuario inactivo' };

  const valid = await comparePassword(password, user.password_hash);
  if (!valid)              throw { status: 401, message: 'Credenciales incorrectas' };

  const token = generateToken({
    usuario_id: user.usuario_id,
    username:   user.username,
    nombre:     user.nombre,
    rol:        user.rol,
  });

  // Registrar login en bitácora
  await db.query(
    `INSERT INTO bitacora (tabla_afectada, accion, registro_id, descripcion, usuario_id)
     VALUES ('usuario', 'LOGIN', $1, $2, $1)`,
    [user.usuario_id, `Login exitoso — ${user.username}`]
  );

  const { password_hash, ...userSafe } = user;
  return { token, user: userSafe };
};

const logout = async (usuario_id) => {
  await db.query(
    `INSERT INTO bitacora (tabla_afectada, accion, registro_id, descripcion, usuario_id)
     VALUES ('usuario', 'LOGOUT', $1, 'Sesión cerrada', $1)`,
    [usuario_id]
  );
};

module.exports = { login, logout };
