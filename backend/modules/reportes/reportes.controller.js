const svc       = require('./reportes.service');
const { ok }    = require('../../utils/response');

const resumenHoy = async (req, res, next) => {
  try { return ok(res, await svc.resumenHoy()); } catch (e) { next(e); }
};

const ventasPorDia = async (req, res, next) => {
  try {
    const { desde = new Date(new Date().setDate(1)).toISOString().slice(0,10),
            hasta  = new Date().toISOString().slice(0,10) } = req.query;
    return ok(res, await svc.ventasPorDia(desde, hasta));
  } catch (e) { next(e); }
};

const ingresosPorBarbero = async (req, res, next) => {
  try {
    const { desde = new Date(new Date().setDate(1)).toISOString().slice(0,10),
            hasta  = new Date().toISOString().slice(0,10) } = req.query;
    return ok(res, await svc.ingresosPorBarbero(desde, hasta));
  } catch (e) { next(e); }
};

const serviciosMasSolicitados = async (req, res, next) => {
  try {
    const { desde = new Date(new Date().setDate(1)).toISOString().slice(0,10),
            hasta  = new Date().toISOString().slice(0,10) } = req.query;
    return ok(res, await svc.serviciosMasSolicitados(desde, hasta));
  } catch (e) { next(e); }
};

const productosVendidos = async (req, res, next) => {
  try {
    const { desde = new Date(new Date().setDate(1)).toISOString().slice(0,10),
            hasta  = new Date().toISOString().slice(0,10) } = req.query;
    return ok(res, await svc.productosVendidos(desde, hasta));
  } catch (e) { next(e); }
};

const resumenPeriodo = async (req, res, next) => {
  try {
    const { desde = new Date(new Date().setDate(1)).toISOString().slice(0,10),
            hasta  = new Date().toISOString().slice(0,10) } = req.query;
    return ok(res, await svc.resumenPeriodo(desde, hasta));
  } catch (e) { next(e); }
};

module.exports = { resumenHoy, ventasPorDia, ingresosPorBarbero, serviciosMasSolicitados, productosVendidos, resumenPeriodo };
