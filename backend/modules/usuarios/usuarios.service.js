const db               = require('../../config/db');
const { hashPassword } = require('../../utils/bcrypt');

const getAll = async () => {
  const { rows } = await db.query(
    `SELECT u.usuario_id, u.nombre, u.gmail, u.username,
            u.porcentaje_ganancia, u.activo, u.created_at,
            r.descripcion_rol AS rol
     FROM usuario u
     JOIN rol r ON u.rol_id = r.rol_id
     ORDER BY u.nombre`
  );
  return rows;
};

const getById = async (id) => {
  const { rows } = await db.query(
    `SELECT u.usuario_id, u.nombre, u.gmail, u.username,
            u.porcentaje_ganancia, u.activo, u.created_at,
            r.descripcion_rol AS rol
     FROM usuario u
     JOIN rol r ON u.rol_id = r.rol_id
     WHERE u.usuario_id = $1`,
    [id]
  );
  if (!rows[0]) throw { status: 404, message: 'Usuario no encontrado' };
  return rows[0];
};

const create = async ({ nombre, gmail, username, password, porcentaje_ganancia = 0, rol_id }) => {
  const password_hash = await hashPassword(password);
  const { rows } = await db.query(
    `INSERT INTO usuario (nombre, gmail, username, password_hash, porcentaje_ganancia, rol_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING usuario_id, nombre, gmail, username, porcentaje_ganancia, activo`,
    [nombre, gmail, username, password_hash, porcentaje_ganancia, rol_id]
  );
  return rows[0];
};

const update = async (id, { nombre, gmail, porcentaje_ganancia, activo, rol_id }) => {
  const { rows } = await db.query(
    `UPDATE usuario
     SET nombre = COALESCE($1, nombre),
         gmail  = COALESCE($2, gmail),
         porcentaje_ganancia = COALESCE($3, porcentaje_ganancia),
         activo = COALESCE($4, activo),
         rol_id = COALESCE($5, rol_id)
     WHERE usuario_id = $6
     RETURNING usuario_id, nombre, gmail, username, porcentaje_ganancia, activo`,
    [nombre, gmail, porcentaje_ganancia, activo, rol_id, id]
  );
  if (!rows[0]) throw { status: 404, message: 'Usuario no encontrado' };
  return rows[0];
};

const updatePassword = async (id, newPassword) => {
  const password_hash = await hashPassword(newPassword);
  await db.query(
    `UPDATE usuario SET password_hash = $1 WHERE usuario_id = $2`,
    [password_hash, id]
  );
};

const remove = async (id) => {
  await db.query(
    `UPDATE usuario SET activo = FALSE WHERE usuario_id = $1`, [id]
  );
};

const getRoles = async () => {
  const { rows } = await db.query(`SELECT * FROM rol ORDER BY rol_id`);
  return rows;
};

module.exports = { getAll, getById, create, update, updatePassword, remove, getRoles };
