const express = require('express');
const router = express.Router();
const { autenticar } = require('../middleware/auth');
const ctrl = require('../controllers/sessaoController');

router.get('/', autenticar, ctrl.listar);
router.get('/hoje', autenticar, ctrl.hoje);
router.post('/', autenticar, ctrl.criar);
router.patch('/:id/status', autenticar, ctrl.atualizarStatus);

module.exports = router;
