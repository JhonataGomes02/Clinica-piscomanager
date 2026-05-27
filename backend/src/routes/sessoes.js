const express = require('express');
const router  = express.Router();
const { listar, criar, atualizarStatus, hoje } = require('../controllers/sessaoController');
const { autenticar, apenasPsicologo } = require('../middlewares/auth');

router.get('/hoje',         autenticar, hoje);
router.get('/',             autenticar, listar);
router.post('/',            autenticar, apenasPsicologo, criar);
router.patch('/:id/status', autenticar, apenasPsicologo, atualizarStatus);

module.exports = router;
