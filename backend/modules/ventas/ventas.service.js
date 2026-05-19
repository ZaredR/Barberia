const db = require('../../config/db');

const getAll = async ({ fecha, usuario_id } = {}) => {
  let sql = `SELECT * FROM v_reporte_ventas WHERE 1=1`;
  const params = [];
  if (fecha)      { params.push(fecha);      sql += ` AND fecha = $${params.length}`; }
  if (usuario_id) { params.push(usuario_id); sql += ` AND cajero_id = $${params.length}`; }
  sql += ` ORDER BY venta_id DESC`;
  const { rows } = await db.query(sql, params);
  return rows;
};

const getById = async (id) => {
  const { rows: [venta] } = await db.query(
    `SELECT v.*, u.nombre AS cajero FROM ventas v
     JOIN usuario u ON v.usuario_id = u.usuario_id
     WHERE v.venta_id = $1`,
    [id]
  );
  if (!venta) throw { status: 404, message: 'Venta no encontrada' };

  const { rows: detalles } = await db.query(
    `SELECT dv.*, s.tipo_servicio FROM detalle_ventas dv
     LEFT JOIN servicio s ON dv.servicio_id = s.servicio_id
     WHERE dv.venta_id = $1`,
    [id]
  );

  const { rows: productos } = await db.query(
    `SELECT dp.*, p.nombre AS producto_nombre
     FROM detalle_producto dp
     JOIN producto p ON dp.producto_id = p.producto_id
     WHERE dp.detalle_id = ANY(
       SELECT detalle_id FROM detalle_ventas WHERE venta_id = $1
     )`,
    [id]
  );

  return { ...venta, detalles, productos };
};

/**
 * Crear venta directa (sin reserva) con transacción
 * body: { items: [{ tipo: 'servicio'|'producto', id, cantidad }] }
 */
const create = async (usuario_id, items = []) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    // Crear cabecera
    const { rows: [venta] } = await client.query(
      `INSERT INTO ventas (fecha, total, usuario_id) VALUES (CURRENT_DATE, 0, $1) RETURNING *`,
      [usuario_id]
    );

    for (const item of items) {
      if (item.tipo === 'servicio') {
        const { rows: [svc] } = await client.query(
          `SELECT precio FROM servicio WHERE servicio_id = $1`, [item.id]
        );
        if (!svc) throw { status: 400, message: `Servicio ${item.id} no encontrado` };
        const subtotal = svc.precio * (item.cantidad || 1);
        await client.query(
          `INSERT INTO detalle_ventas (cantidad, precio, subtotal, venta_id, servicio_id)
           VALUES ($1, $2, $3, $4, $5)`,
          [item.cantidad || 1, svc.precio, subtotal, venta.venta_id, item.id]
        );
      } else if (item.tipo === 'producto') {
        const { rows: [prod] } = await client.query(
          `SELECT precio, stock FROM producto WHERE producto_id = $1`, [item.id]
        );
        if (!prod) throw { status: 400, message: `Producto ${item.id} no encontrado` };
        if (prod.stock < item.cantidad)
          throw { status: 400, message: `Stock insuficiente para producto ${item.id}` };

        const subtotal = prod.precio * item.cantidad;
        const { rows: [detalle] } = await client.query(
          `INSERT INTO detalle_ventas (cantidad, precio, subtotal, venta_id)
           VALUES ($1, $2, $3, $4) RETURNING detalle_id`,
          [item.cantidad, prod.precio, subtotal, venta.venta_id]
        );
        await client.query(
          `INSERT INTO detalle_producto (detalle_id, producto_id, cantidad, precio)
           VALUES ($1, $2, $3, $4)`,
          [detalle.detalle_id, item.id, item.cantidad, prod.precio]
        );
      }
    }

    await client.query('COMMIT');
    return getById(venta.venta_id);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const remove = async (id) => {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    await client.query(`DELETE FROM detalle_producto WHERE detalle_id IN
      (SELECT detalle_id FROM detalle_ventas WHERE venta_id = $1)`, [id]);
    await client.query(`DELETE FROM detalle_ventas WHERE venta_id = $1`, [id]);
    await client.query(`DELETE FROM ventas WHERE venta_id = $1`, [id]);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

module.exports = { getAll, getById, create, remove };
