const router = require('express').Router();
const c      = require('./servicios.controller');
const auth   = require('../../middlewares/auth.middleware');
const role   = require('../../middlewares/role.middleware');

router.get('/',     auth, c.getAll);
router.get('/:id',  auth, c.getById);
router.post('/',    auth, role('admin'), c.create);
router.put('/:id',  auth, role('admin'), c.update);
router.delete('/:id', auth, role('admin'), c.remove);

module.exports = router;
