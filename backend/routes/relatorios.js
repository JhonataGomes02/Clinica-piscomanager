const express = require('express');
const router = express.Router();
const { autenticar } = require('../middleware/auth');
const ctrl = require('../controllers/relatorioController');

router.get('/dashboard', autenticar, ctrl.dashboard);
router.get('/profissionais', autenticar, ctrl.atendimentosPorProfissional);

module.exports = router;
