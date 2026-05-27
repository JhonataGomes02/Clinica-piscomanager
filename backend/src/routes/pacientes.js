const express = require('express');
const router  = express.Router();
const { listar, buscarPorId, criar, atualizar } = require('../controllers/pacienteController');
const { autenticar, apenasPsicologo } = require('../middlewares/auth');

router.get('/',      autenticar, apenasPsicologo, listar);
router.get('/:id',   autenticar, apenasPsicologo, buscarPorId);
router.post('/',     autenticar, criar);
router.put('/:id',   autenticar, atualizar);

module.exports = router;
