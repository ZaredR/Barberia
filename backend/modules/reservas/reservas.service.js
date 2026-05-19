const db = require('../../config/db');

const getAll = async ({ fecha, barbero_id, estado_id } = {}) => {
  let sql = `SELECT * FROM v_agenda WHERE 1=1`;
  const params = [];

  if (fecha) { params.push(fecha); sql += ` AND fecha = $${params.length}`; }
  if (barbero_id) { params.push(barbero_id); sql += ` AND barbero_id = $${params.length}`; }
  if (estado_id)  { params.push(estado_id);  sql += ` AND estado_id  = $${params.length}`; }

  sql += ` ORDER BY fecha, hora`;
  const { rows } = await db.query(sql, params);
  return rows;
};

const getById = async (id) => {
  const { rows } = await db.query(`SELECT * FROM v_agenda WHERE reserva_id = $1`, [id]);
  if (!rows[0]) throw { status: 404, message: 'Reserva no encontrada' };
  return rows[0];
};

const create = async ({ fecha, hora, cliente_nombre, cliente_telefono, notas, servicio_id, barbero_id }) => {
  const { rows } = await db.query(
    `SELECT sp_crear_reserva($1,$2,$3,$4,$5,$6,$7) AS reserva_id`,
    [fecha, hora, cliente_nombre, cliente_telefono, servicio_id, barbero_id, notas]
  );
  return getById(rows[0].reserva_id);
};

const updateEstado = async (id, estado_id) => {
  const { rows } = await db.query(
    `UPDATE reservas SET estado_id = $1 WHERE reserva_id = $2 RETURNING *`,
    [estado_id, id]
  );
  if (!rows[0]) throw { status: 404, message: 'Reserva no encontrada' };
  return rows[0];
};

const update = async (id, { fecha, hora, cliente_nombre, cliente_telefono, notas, servicio_id, barbero_id }) => {
  const { rows } = await db.query(
    `UPDATE reservas
     SET fecha            = COALESCE($1, fecha),
         hora             = COALESCE($2, hora),
         cliente_nombre   = COALESCE($3, cliente_nombre),
         cliente_telefono = COALESCE($4, cliente_telefono),
         notas            = COALESCE($5, notas),
         servicio_id      = COALESCE($6, servicio_id),
         barbero_id       = COALESCE($7, barbero_id)
     WHERE reserva_id = $8 RETURNING *`,
    [fecha, hora, cliente_nombre, cliente_telefono, notas, servicio_id, barbero_id, id]
  );
  if (!rows[0]) throw { status: 404, message: 'Reserva no encontrada' };
  return rows[0];
};

const cerrar = async (reserva_id, usuario_id) => {
  const { rows } = await db.query(
    `SELECT sp_cerrar_reserva($1, $2) AS venta_id`,
    [reserva_id, usuario_id]
  );
  return { venta_id: rows[0].venta_id };
};

const remove = async (id) => {
  const estadoCancelada = await db.query(
    `SELECT estado_id FROM estado WHERE descripcion_estado = 'cancelada'`
  );
  await db.query(
    `UPDATE reservas SET estado_id = $1 WHERE reserva_id = $2`,
    [estadoCancelada.rows[0].estado_id, id]
  );
};

const getEstados = async () => {
  const { rows } = await db.query(`SELECT * FROM estado ORDER BY estado_id`);
  return rows;
};

module.exports = { getAll, getById, create, update, updateEstado, cerrar, remove, getEstados };
