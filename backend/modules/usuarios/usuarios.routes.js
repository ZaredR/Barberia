const router = require('express').Router();
const c      = require('./usuarios.controller');
const auth   = require('../../middlewares/auth.middleware');
const role   = require('../../middlewares/role.middleware');

router.use(auth);

router.get('/roles',              role('admin'),                     c.getRoles);
router.get('/',                   role('admin'),                     c.getAll);
router.get('/:id',                role('admin'),                     c.getById);
router.post('/',                  role('admin'),                     c.create);
router.put('/:id',                role('admin'),                     c.update);
router.patch('/:id/password',     role('admin'),                     c.updatePassword);
router.delete('/:id',             role('admin'),                     c.remove);

module.exports = router;
