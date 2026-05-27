const express = require('express');
const router = express.Router();
const { autenticar, autorizar } = require('../middleware/auth');
const ctrl = require('../controllers/financeiroController');

router.get('/', autenticar, ctrl.listar);
router.get('/resumo', autenticar, ctrl.resumo);
router.post('/', autenticar, autorizar('administrador', 'psicologo'), ctrl.registrar);

module.exports = router;
