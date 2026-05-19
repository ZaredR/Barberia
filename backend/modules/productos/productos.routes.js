const router = require('express').Router();
const c      = require('./productos.controller');
const auth   = require('../../middlewares/auth.middleware');
const role   = require('../../middlewares/role.middleware');

router.use(auth);

router.get('/',                 c.getAll);
router.get('/:id',              c.getById);
router.post('/',                role('admin'), c.create);
router.put('/:id',              role('admin'), c.update);
router.patch('/:id/stock',      role('admin'), c.ajustarStock);
router.delete('/:id',           role('admin'), c.remove);

module.exports = router;
