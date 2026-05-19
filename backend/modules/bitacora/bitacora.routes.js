const router = require('express').Router();
const c      = require('./bitacora.controller');
const auth   = require('../../middlewares/auth.middleware');
const role   = require('../../middlewares/role.middleware');

router.get('/', auth, role('admin'), c.getAll);

module.exports = router;
