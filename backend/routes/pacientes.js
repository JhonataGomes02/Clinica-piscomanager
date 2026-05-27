const express = require('express');
const router = express.Router();
const { autenticar, autorizar } = require('../middleware/auth');
const ctrl = require('../controllers/pacienteController');

router.get('/', autenticar, ctrl.listar);
router.get('/:id', autenticar, ctrl.buscarPorId);
router.post('/', autenticar, autorizar('administrador', 'psicologo'), ctrl.criar);
router.put('/:id', autenticar, autorizar('administrador', 'psicologo'), ctrl.atualizar);

module.exports = router;
