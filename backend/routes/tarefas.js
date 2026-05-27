const express = require('express');
const router = express.Router();
const { autenticar } = require('../middleware/auth');
const ctrl = require('../controllers/tarefaController');

router.get('/', autenticar, ctrl.listar);
router.post('/', autenticar, ctrl.criar);
router.patch('/:id/concluir', autenticar, ctrl.concluir);

module.exports = router;
