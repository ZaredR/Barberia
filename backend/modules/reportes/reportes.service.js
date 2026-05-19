const db = require('../../config/db');

// Ventas totales agrupadas por día en un rango
const ventasPorDia = async (desde, hasta) => {
  const { rows } = await db.query(
    `SELECT fecha, SUM(total) AS total, COUNT(*) AS num_ventas
     FROM ventas
     WHERE fecha BETWEEN $1 AND $2
     GROUP BY fecha ORDER BY fecha`,
    [desde, hasta]
  );
  return rows;
};

// Ingresos por barbero en un período
const ingresosPorBarbero = async (desde, hasta) => {
  const { rows } = await db.query(
    `SELECT u.nombre AS barbero,
            COUNT(r.reserva_id)::int AS total_citas,
            SUM(s.precio)            AS ingresos_brutos,
            SUM(s.precio * u.porcentaje_ganancia / 100) AS comision
     FROM reservas r
     JOIN usuario  u ON r.barbero_id  = u.usuario_id
     JOIN servicio s ON r.servicio_id = s.servicio_id
     JOIN estado   e ON r.estado_id   = e.estado_id
     WHERE e.descripcion_estado = 'completada'
       AND r.fecha BETWEEN $1 AND ($2::date + INTERVAL '1 day' - INTERVAL '1 second')
     GROUP BY u.usuario_id, u.nombre, u.porcentaje_ganancia
     ORDER BY ingresos_brutos DESC`,
    [desde, hasta]
  );
  return rows;
};

// Servicios más solicitados
const serviciosMasSolicitados = async (desde, hasta) => {
  const { rows } = await db.query(
    `SELECT s.tipo_servicio, COUNT(*)::int AS total
     FROM reservas r
     JOIN servicio s ON r.servicio_id = s.servicio_id
     WHERE r.fecha BETWEEN $1 AND ($2::date + INTERVAL '1 day' - INTERVAL '1 second')
     GROUP BY s.servicio_id, s.tipo_servicio
     ORDER BY total DESC`,
    [desde, hasta]
  );
  return rows;
};

// Resumen del dashboard (hoy)
const resumenHoy = async () => {
  const { rows: [reservas] } = await db.query(
    `SELECT COUNT(*) AS total,
            COUNT(*) FILTER (WHERE e.descripcion_estado = 'completada') AS completadas,
            COUNT(*) FILTER (WHERE e.descripcion_estado = 'pendiente')  AS pendientes,
            COUNT(*) FILTER (WHERE e.descripcion_estado = 'cancelada')  AS canceladas
     FROM reservas r
     JOIN estado e ON r.estado_id = e.estado_id
     WHERE r.fecha = CURRENT_DATE`
  );

  const { rows: [ventas] } = await db.query(
    `SELECT COUNT(*) AS num_ventas, COALESCE(SUM(total), 0) AS total_dia
     FROM ventas WHERE fecha = CURRENT_DATE`
  );

  const { rows: stockBajo } = await db.query(
    `SELECT COUNT(*) AS productos_stock_bajo FROM v_stock_bajo`
  );

  return { reservas, ventas, stockBajo: stockBajo[0] };
};

const productosVendidos = async (desde, hasta) => {
  const { rows } = await db.query(
    `SELECT p.nombre,
            SUM(dp.cantidad)              AS unidades,
            SUM(dp.precio * dp.cantidad)  AS total
     FROM detalle_producto dp
     JOIN producto p       ON dp.producto_id = p.producto_id
     JOIN detalle_ventas dv ON dp.detalle_id  = dv.detalle_id
     JOIN ventas v          ON dv.venta_id    = v.venta_id
     WHERE v.fecha BETWEEN $1 AND $2
     GROUP BY p.producto_id, p.nombre
     ORDER BY unidades DESC
     LIMIT 10`,
    [desde, hasta]
  );
  return rows;
};

const resumenPeriodo = async (desde, hasta) => {
  const { rows: [ventas] } = await db.query(
    `SELECT COUNT(*)                    AS num_ventas,
            COALESCE(SUM(total),  0)    AS total_ingresos,
            COALESCE(AVG(total),  0)    AS ticket_promedio,
            COALESCE(MAX(total),  0)    AS venta_maxima
     FROM ventas WHERE fecha BETWEEN $1 AND $2`,
    [desde, hasta]
  );
  const { rows: [reservas] } = await db.query(
    `SELECT COUNT(*)                                                             AS total_reservas,
            COUNT(*) FILTER (WHERE e.descripcion_estado = 'completada')          AS completadas,
            COUNT(*) FILTER (WHERE e.descripcion_estado = 'cancelada')           AS canceladas,
            COUNT(*) FILTER (WHERE e.descripcion_estado IN ('pendiente','confirmada')) AS pendientes
     FROM reservas r
     JOIN estado e ON r.estado_id = e.estado_id
     WHERE r.fecha BETWEEN $1 AND $2`,
    [desde, hasta]
  );
  return { ventas, reservas };
};

module.exports = { ventasPorDia, ingresosPorBarbero, serviciosMasSolicitados, resumenHoy, productosVendidos, resumenPeriodo };
