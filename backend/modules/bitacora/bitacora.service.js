const db = require('../../config/db');

const getAll = async ({ tabla, accion, usuario_id, desde, hasta, limit = 100 } = {}) => {
  let sql = `SELECT * FROM v_bitacora WHERE 1=1`;
  const params = [];

  if (tabla)      { params.push(tabla);      sql += ` AND tabla_afectada = $${params.length}`; }
  if (accion)     { params.push(accion);     sql += ` AND accion = $${params.length}`; }
  if (usuario_id) { params.push(usuario_id); sql += ` AND usuario_id = $${params.length}`; }
  if (desde)      { params.push(desde);      sql += ` AND fecha_hora >= $${params.length}`; }
  if (hasta)      { params.push(hasta);      sql += ` AND fecha_hora <= $${params.length}`; }

  params.push(Math.min(Number(limit), 500));
  sql += ` LIMIT $${params.length}`;

  const { rows } = await db.query(sql, params);
  return rows;
};

module.exports = { getAll };
