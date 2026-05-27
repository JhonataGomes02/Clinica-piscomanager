const express = require('express');
const router  = express.Router();
const { login, cadastrar, registrar } = require('../controllers/authController');
const { autenticar, apenasAdmin } = require('../middlewares/auth');

router.post('/login',     login);
router.post('/registrar', registrar);                        // público
router.post('/cadastrar', autenticar, apenasAdmin, cadastrar); // só admin

module.exports = router;
