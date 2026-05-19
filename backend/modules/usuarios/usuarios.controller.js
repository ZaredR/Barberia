const svc           = require('./usuarios.service');
const { ok, error } = require('../../utils/response');

const getAll         = async (req, res, next) => { try { return ok(res, await svc.getAll()); } catch (e) { next(e); } };
const getById        = async (req, res, next) => { try { return ok(res, await svc.getById(req.params.id)); } catch (e) { next(e); } };
const getRoles       = async (req, res, next) => { try { return ok(res, await svc.getRoles()); } catch (e) { next(e); } };

const create = async (req, res, next) => {
  try {
    const { nombre, gmail, username, password, porcentaje_ganancia, rol_id } = req.body;
    if (!nombre || !gmail || !username || !password || !rol_id)
      return error(res, 'Campos requeridos: nombre, gmail, username, password, rol_id', 400);
    return ok(res, await svc.create(req.body), 'Usuario creado', 201);
  } catch (e) { next(e); }
};

const update = async (req, res, next) => {
  try { return ok(res, await svc.update(req.params.id, req.body), 'Usuario actualizado'); }
  catch (e) { next(e); }
};

const updatePassword = async (req, res, next) => {
  try {
    const { password } = req.body;
    if (!password) return error(res, 'password es requerido', 400);
    await svc.updatePassword(req.params.id, password);
    return ok(res, null, 'Contraseña actualizada');
  } catch (e) { next(e); }
};

const remove = async (req, res, next) => {
  try { await svc.remove(req.params.id); return ok(res, null, 'Usuario desactivado'); }
  catch (e) { next(e); }
};

module.exports = { getAll, getById, create, update, updatePassword, remove, getRoles };
