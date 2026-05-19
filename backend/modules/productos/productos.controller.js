const svc           = require('./productos.service');
const { ok, error } = require('../../utils/response');

const getAll  = async (req, res, next) => { try { return ok(res, await svc.getAll(req.query)); } catch (e) { next(e); } };
const getById = async (req, res, next) => { try { return ok(res, await svc.getById(req.params.id)); } catch (e) { next(e); } };

const create = async (req, res, next) => {
  try {
    const { nombre, precio } = req.body;
    if (!nombre || !precio) return error(res, 'nombre y precio son requeridos', 400);
    return ok(res, await svc.create(req.body), 'Producto creado', 201);
  } catch (e) { next(e); }
};

const update = async (req, res, next) => {
  try { return ok(res, await svc.update(req.params.id, req.body), 'Producto actualizado'); }
  catch (e) { next(e); }
};

const ajustarStock = async (req, res, next) => {
  try {
    const { cantidad } = req.body;
    if (cantidad === undefined) return error(res, 'cantidad es requerida', 400);
    return ok(res, await svc.ajustarStock(req.params.id, cantidad), 'Stock ajustado');
  } catch (e) { next(e); }
};

const remove = async (req, res, next) => {
  try { await svc.remove(req.params.id); return ok(res, null, 'Producto desactivado'); }
  catch (e) { next(e); }
};

module.exports = { getAll, getById, create, update, ajustarStock, remove };
