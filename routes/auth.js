const router = require('express').Router();
const controller = require('../controllers/authcontroller');
const auth = require('../middleware/auth');

router.post('/signup', controller.signup);
router.post('/login', controller.login);
router.get('/me', auth, controller.me);

module.exports = router;
