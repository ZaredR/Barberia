// servicios.controller.js
const svc           = require('./servicios.service');
const { ok, error } = require('../../utils/response');

const getAll  = async (req, res, next) => { try { return ok(res, await svc.getAll()); } catch (e) { next(e); } };
const getById = async (req, res, next) => { try { return ok(res, await svc.getById(req.params.id)); } catch (e) { next(e); } };

const create = async (req, res, next) => {
  try {
    const { tipo_servicio, precio } = req.body;
    if (!tipo_servicio || !precio) return error(res, 'tipo_servicio y precio son requeridos', 400);
    return ok(res, await svc.create(req.body), 'Servicio creado', 201);
  } catch (e) { next(e); }
};

const update = async (req, res, next) => {
  try { return ok(res, await svc.update(req.params.id, req.body), 'Servicio actualizado'); }
  catch (e) { next(e); }
};

const remove = async (req, res, next) => {
  try { await svc.remove(req.params.id); return ok(res, null, 'Servicio desactivado'); }
  catch (e) { next(e); }
};

module.exports = { getAll, getById, create, update, remove };
