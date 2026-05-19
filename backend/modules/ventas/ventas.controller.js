const svc           = require('./ventas.service');
const { ok, error } = require('../../utils/response');

const getAll  = async (req, res, next) => { try { return ok(res, await svc.getAll(req.query)); } catch (e) { next(e); } };
const getById = async (req, res, next) => { try { return ok(res, await svc.getById(req.params.id)); } catch (e) { next(e); } };

const create = async (req, res, next) => {
  try {
    const { items } = req.body;
    if (!items || !items.length) return error(res, 'items es requerido y no puede estar vacío', 400);
    return ok(res, await svc.create(req.user.usuario_id, items), 'Venta registrada', 201);
  } catch (e) { next(e); }
};

const remove = async (req, res, next) => {
  try { await svc.remove(req.params.id); return ok(res, null, 'Venta eliminada'); }
  catch (e) { next(e); }
};

module.exports = { getAll, getById, create, remove };
