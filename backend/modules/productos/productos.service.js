const db = require('../../config/db');

const getAll = async ({ stock_bajo } = {}) => {
  if (stock_bajo === 'true') {
    const { rows } = await db.query(`SELECT * FROM v_stock_bajo`);
    return rows;
  }
  const { rows } = await db.query(
    `SELECT * FROM producto WHERE activo = TRUE ORDER BY nombre`
  );
  return rows;
};

const getById = async (id) => {
  const { rows } = await db.query(`SELECT * FROM producto WHERE producto_id = $1`, [id]);
  if (!rows[0]) throw { status: 404, message: 'Producto no encontrado' };
  return rows[0];
};

const create = async ({ nombre, descripcion, precio, stock, stock_min }) => {
  const { rows } = await db.query(
    `INSERT INTO producto (nombre, descripcion, precio, stock, stock_min)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [nombre, descripcion, precio, stock ?? 0, stock_min ?? 5]
  );
  return rows[0];
};

const update = async (id, { nombre, descripcion, precio, stock, stock_min, activo }) => {
  const { rows } = await db.query(
    `UPDATE producto
     SET nombre      = COALESCE($1, nombre),
         descripcion = COALESCE($2, descripcion),
         precio      = COALESCE($3, precio),
         stock       = COALESCE($4, stock),
         stock_min   = COALESCE($5, stock_min),
         activo      = COALESCE($6, activo)
     WHERE producto_id = $7 RETURNING *`,
    [nombre, descripcion, precio, stock, stock_min, activo, id]
  );
  if (!rows[0]) throw { status: 404, message: 'Producto no encontrado' };
  return rows[0];
};

const ajustarStock = async (id, cantidad) => {
  const { rows } = await db.query(
    `UPDATE producto SET stock = stock + $1 WHERE producto_id = $2 RETURNING *`,
    [cantidad, id]
  );
  if (!rows[0]) throw { status: 404, message: 'Producto no encontrado' };
  return rows[0];
};

const remove = async (id) => {
  await db.query(`UPDATE producto SET activo = FALSE WHERE producto_id = $1`, [id]);
};

module.exports = { getAll, getById, create, update, ajustarStock, remove };
