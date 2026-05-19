const router = require('express').Router();
const c      = require('./reservas.controller');
const auth   = require('../../middlewares/auth.middleware');
const role   = require('../../middlewares/role.middleware');

router.use(auth);

router.get('/estados',           c.getEstados);
router.get('/',                  c.getAll);
router.get('/:id',               c.getById);
router.post('/',                 role('admin', 'recepcionista', 'barbero'), c.create);
router.put('/:id',               role('admin', 'recepcionista'), c.update);
router.patch('/:id/estado',      role('admin', 'recepcionista', 'barbero'), c.updateEstado);
router.post('/:id/cerrar',       role('admin', 'recepcionista', 'barbero'), c.cerrar);
router.delete('/:id',            role('admin', 'recepcionista'), c.remove);

module.exports = router;
