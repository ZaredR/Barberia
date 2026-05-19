const svc       = require('./bitacora.service');
const { ok }    = require('../../utils/response');

const getAll = async (req, res, next) => {
  try { return ok(res, await svc.getAll(req.query)); } catch (e) { next(e); }
};

module.exports = { getAll };
