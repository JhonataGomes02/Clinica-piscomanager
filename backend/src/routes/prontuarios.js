const express = require('express');
const router  = express.Router();
const { buscar, salvar, listarEvolucoes, adicionarEvolucao } = require('../controllers/prontuarioController');
const { autenticar, apenasPsicologo } = require('../middlewares/auth');

router.get('/:pacienteId',            autenticar, apenasPsicologo, buscar);
router.put('/:pacienteId',            autenticar, apenasPsicologo, salvar);
router.get('/:pacienteId/evolucoes',  autenticar, apenasPsicologo, listarEvolucoes);
router.post('/:pacienteId/evolucoes', autenticar, apenasPsicologo, adicionarEvolucao);

module.exports = router;
