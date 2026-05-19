const router     = require('express').Router();
const controller = require('./auth.controller');
const auth       = require('../../middlewares/auth.middleware');

router.post('/login',  controller.login);
router.post('/logout', auth, controller.logout);
router.get('/me',      auth, controller.me);

module.exports = router;
