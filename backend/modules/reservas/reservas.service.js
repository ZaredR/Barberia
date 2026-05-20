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

const checkConflicto = async (barbero_id, fecha, hora, excluir_id = null) => {
  const { rows } = await db.query(
    `SELECT r.reserva_id FROM reservas r
     JOIN estado e ON r.estado_id = e.estado_id
     WHERE r.barbero_id = $1
       AND r.fecha      = $2
       AND r.hora       = $3::time
       AND e.descripcion_estado NOT IN ('cancelada')
       ${excluir_id ? 'AND r.reserva_id != $4' : ''}`,
    excluir_id ? [barbero_id, fecha, hora, excluir_id] : [barbero_id, fecha, hora]
  );
  if (rows.length > 0) throw { status: 409, message: 'El barbero ya tiene una cita en ese horario' };
};

const create = async ({ fecha, hora, cliente_nombre, cliente_telefono, notas, servicio_id, barbero_id }) => {
  await checkConflicto(barbero_id, fecha, hora);
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
  if (fecha || hora || barbero_id) {
    const current = await getById(id);
    await checkConflicto(
      barbero_id  ?? current.barbero_id,
      fecha       ?? current.fecha,
      hora        ?? current.hora?.slice(0, 5),
      id
    );
  }
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

const cerrar = async (reserva_id, usuario_id, items = []) => {
  const { rows } = await db.query(
    `SELECT sp_cerrar_reserva($1, $2) AS venta_id`,
    [reserva_id, usuario_id]
  );
  const venta_id = rows[0].venta_id;

  if (items.length > 0) {
    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      // Obtener el detalle_id del servicio creado por sp_cerrar_reserva
      const { rows: [detalleServicio] } = await client.query(
        `SELECT detalle_id FROM detalle_ventas WHERE venta_id = $1 LIMIT 1`,
        [venta_id]
      );
      if (!detalleServicio) throw { status: 500, message: 'No se encontró el detalle de la venta' };

      for (const item of items) {
        const { rows: [prod] } = await client.query(
          `SELECT precio, stock FROM producto WHERE producto_id = $1`, [item.id]
        );
        if (!prod) throw { status: 400, message: `Producto ${item.id} no encontrado` };
        if (prod.stock < item.cantidad)
          throw { status: 400, message: `Stock insuficiente para producto ${item.id}` };

        await client.query(
          `INSERT INTO detalle_producto (detalle_id, producto_id, cantidad, precio)
           VALUES ($1, $2, $3, $4)`,
          [detalleServicio.detalle_id, item.id, item.cantidad, prod.precio]
        );
      }

      // Actualizar subtotal del detalle y el total de la venta
      await client.query(
        `UPDATE detalle_ventas
         SET subtotal = precio * cantidad + (
           SELECT COALESCE(SUM(dp.precio * dp.cantidad), 0)
           FROM detalle_producto dp WHERE dp.detalle_id = $1
         )
         WHERE detalle_id = $1`,
        [detalleServicio.detalle_id]
      );
      await client.query(
        `UPDATE ventas SET total = (
          SELECT COALESCE(SUM(subtotal), 0) FROM detalle_ventas WHERE venta_id = $1
        ) WHERE venta_id = $1`,
        [venta_id]
      );
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  return { venta_id };
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
