const router = require('express').Router();
const c      = require('./reportes.controller');
const auth   = require('../../middlewares/auth.middleware');
const role   = require('../../middlewares/role.middleware');

router.use(auth);

router.get('/hoy',               c.resumenHoy);
router.get('/ventas-por-dia',    role('admin', 'recepcionista'), c.ventasPorDia);
router.get('/por-barbero',       role('admin'), c.ingresosPorBarbero);
router.get('/servicios-top',     role('admin', 'recepcionista'), c.serviciosMasSolicitados);

module.exports = router;
