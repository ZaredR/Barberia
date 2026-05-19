const db = require('../../config/db');

const getAll = async () => {
  const { rows } = await db.query(
    `SELECT * FROM servicio WHERE activo = TRUE ORDER BY tipo_servicio`
  );
  return rows;
};

const getById = async (id) => {
  const { rows } = await db.query(`SELECT * FROM servicio WHERE servicio_id = $1`, [id]);
  if (!rows[0]) throw { status: 404, message: 'Servicio no encontrado' };
  return rows[0];
};

const create = async ({ tipo_servicio, precio }) => {
  const { rows } = await db.query(
    `INSERT INTO servicio (tipo_servicio, precio) VALUES ($1, $2)
     RETURNING *`,
    [tipo_servicio, precio]
  );
  return rows[0];
};

const update = async (id, { tipo_servicio, precio, activo }) => {
  const { rows } = await db.query(
    `UPDATE servicio
     SET tipo_servicio = COALESCE($1, tipo_servicio),
         precio        = COALESCE($2, precio),
         activo        = COALESCE($3, activo)
     WHERE servicio_id = $4 RETURNING *`,
    [tipo_servicio, precio, activo, id]
  );
  if (!rows[0]) throw { status: 404, message: 'Servicio no encontrado' };
  return rows[0];
};

const remove = async (id) => {
  await db.query(`UPDATE servicio SET activo = FALSE WHERE servicio_id = $1`, [id]);
};

module.exports = { getAll, getById, create, update, remove };
