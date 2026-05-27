const express = require('express');
const router  = express.Router();
const { listar, registrar, resumo, receitaMensal } = require('../controllers/financeiroController');
const { autenticar, apenasAdmin } = require('../middlewares/auth');

router.get('/resumo',         autenticar, resumo);
router.get('/receita-mensal', autenticar, receitaMensal);
router.get('/',               autenticar, listar);
router.post('/',              autenticar, registrar);

module.exports = router;
