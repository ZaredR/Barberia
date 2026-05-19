const svc           = require('./reservas.service');
const { ok, error } = require('../../utils/response');

const getAll = async (req, res, next) => {
  try { return ok(res, await svc.getAll(req.query)); } catch (e) { next(e); }
};

const getById = async (req, res, next) => {
  try { return ok(res, await svc.getById(req.params.id)); } catch (e) { next(e); }
};

const getEstados = async (req, res, next) => {
  try { return ok(res, await svc.getEstados()); } catch (e) { next(e); }
};

const create = async (req, res, next) => {
  try {
    const { fecha, hora, cliente_nombre, cliente_telefono, servicio_id, barbero_id } = req.body;
    if (!fecha || !hora || !cliente_nombre || !cliente_telefono || !servicio_id || !barbero_id)
      return error(res, 'Campos requeridos: fecha, hora, cliente_nombre, cliente_telefono, servicio_id, barbero_id', 400);
    return ok(res, await svc.create(req.body), 'Reserva creada', 201);
  } catch (e) { next(e); }
};

const update = async (req, res, next) => {
  try { return ok(res, await svc.update(req.params.id, req.body), 'Reserva actualizada'); }
  catch (e) { next(e); }
};

const updateEstado = async (req, res, next) => {
  try {
    const { estado_id } = req.body;
    if (!estado_id) return error(res, 'estado_id es requerido', 400);
    return ok(res, await svc.updateEstado(req.params.id, estado_id), 'Estado actualizado');
  } catch (e) { next(e); }
};

const cerrar = async (req, res, next) => {
  try {
    const data = await svc.cerrar(req.params.id, req.user.usuario_id);
    return ok(res, data, 'Reserva cerrada y venta generada');
  } catch (e) { next(e); }
};

const remove = async (req, res, next) => {
  try { await svc.remove(req.params.id); return ok(res, null, 'Reserva cancelada'); }
  catch (e) { next(e); }
};

module.exports = { getAll, getById, create, update, updateEstado, cerrar, remove, getEstados };
