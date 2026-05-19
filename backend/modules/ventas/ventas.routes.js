const router = require('express').Router();
const c      = require('./ventas.controller');
const auth   = require('../../middlewares/auth.middleware');
const role   = require('../../middlewares/role.middleware');

router.use(auth);

router.get('/',      c.getAll);
router.get('/:id',   c.getById);
router.post('/',     role('admin', 'barbero'), c.create);
router.delete('/:id',role('admin'), c.remove);

module.exports = router;
