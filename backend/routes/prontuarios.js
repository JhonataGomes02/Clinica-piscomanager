const express = require('express');
const router = express.Router();
const { autenticar, autorizar } = require('../middleware/auth');
const ctrl = require('../controllers/prontuarioController');

router.get('/sem-evolucao', autenticar, ctrl.semProntuario);
router.get('/:pacienteId', autenticar, autorizar('psicologo', 'administrador'), ctrl.buscar);
router.put('/:pacienteId', autenticar, autorizar('psicologo'), ctrl.atualizar);
router.post('/evolucao', autenticar, autorizar('psicologo'), ctrl.adicionarEvolucao);

module.exports = router;
