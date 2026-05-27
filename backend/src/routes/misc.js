const express  = require('express');
const router   = express.Router();
const { Op }   = require('sequelize');
const { autenticar, apenasPsicologo } = require('../middlewares/auth');
const rel = require('../controllers/relatorioController');
const tar = require('../controllers/tarefaController');
const con = require('../controllers/convenioController');
const { gerarReciboPDF, gerarLaudoPDF } = require('../services/pdfService');
const { enviarLembretesessao } = require('../services/emailService');
const { dispararLembretes }    = require('../services/lembreteService');
const Pagamento  = require('../models/Pagamento');
const Sessao     = require('../models/Sessao');
const Paciente   = require('../models/Paciente');
const Usuario    = require('../models/Usuario');
const Prontuario = require('../models/Prontuario');

// Relatórios
router.get('/dashboard',                 autenticar, rel.dashboard);
router.get('/prontuarios-pendentes',     autenticar, apenasPsicologo, rel.prontuariosPendentes);
router.get('/atendimentos-profissional', autenticar, rel.atendimentosPorProfissional);

// Tarefas
router.get   ('/tarefas',     autenticar, tar.listar);
router.post  ('/tarefas',     autenticar, tar.criar);
router.patch ('/tarefas/:id', autenticar, tar.concluir);

// Convênios
router.get   ('/convenios',     autenticar, con.listar);
router.post  ('/convenios',     autenticar, con.criar);
router.put   ('/convenios/:id', autenticar, con.atualizar);
router.delete('/convenios/:id', autenticar, con.remover);

// PDF — Recibo
router.get('/documentos/recibo/:pagamentoId', autenticar, async (req, res) => {
  try {
    const p = await Pagamento.findByPk(req.params.pagamentoId, {
      include: [
        { model: Paciente, as: 'paciente', include: [{ model: Usuario, as: 'usuario', attributes: ['nome'] }] },
        { model: Sessao,   as: 'sessao',   include: [{ model: Usuario, as: 'psicologo', attributes: ['nome'] }] },
      ]
    });
    if (!p) return res.status(404).json({ erro: 'Pagamento não encontrado.' });
    gerarReciboPDF(res, {
      nomePaciente:   p.paciente?.usuario?.nome || '—',
      nomePsicologo:  p.sessao?.psicologo?.nome || '—',
      valor:          p.valor,
      formaPagamento: p.forma_pagamento,
      data:           new Date(p.data_pagamento || p.criado_em).toLocaleDateString('pt-BR'),
      sessaoId:       p.sessao_id,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: 'Erro ao gerar recibo.' });
  }
});

// PDF — Laudo
router.get('/documentos/laudo/:pacienteId', autenticar, apenasPsicologo, async (req, res) => {
  try {
    const paciente = await Paciente.findByPk(req.params.pacienteId, {
      include: [
        { model: Usuario,    as: 'usuario',   attributes: ['nome'] },
        { model: Usuario,    as: 'psicologo', attributes: ['nome','crp'] },
        { model: Prontuario, as: 'prontuario' },
      ]
    });
    if (!paciente) return res.status(404).json({ erro: 'Paciente não encontrado.' });
    gerarLaudoPDF(res, {
      nomePaciente:  paciente.usuario?.nome || '—',
      nomePsicologo: paciente.psicologo?.nome || '—',
      crp:           paciente.psicologo?.crp,
      hipotese:      paciente.prontuario?.hipotese_diagnostica,
      observacoes:   paciente.prontuario?.queixa_principal,
      data:          new Date().toLocaleDateString('pt-BR'),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ erro: 'Erro ao gerar laudo.' });
  }
});

// Lembretes — disparar todos (automático ou manual para teste)
router.post('/lembretes/disparar', autenticar, async (req, res) => {
  try {
    await dispararLembretes();
    return res.json({ mensagem: 'Lembretes verificados e enviados.' });
  } catch (e) {
    return res.status(500).json({ erro: 'Erro ao disparar lembretes.' });
  }
});

// Lembretes — envio manual individual
router.post('/lembretes/enviar', autenticar, async (req, res) => {
  try {
    const { paciente_id } = req.body;
    const paciente = await Paciente.findByPk(paciente_id, {
      include: [{ model: Usuario, as: 'usuario', attributes: ['nome','email'] }]
    });
    if (!paciente) return res.status(404).json({ erro: 'Paciente não encontrado.' });

    const sessao = await Sessao.findOne({
      where: {
        paciente_id,
        status: { [Op.in]: ['agendada','confirmada'] },
        data_hora_inicio: { [Op.gt]: new Date() },
      },
      include: [{ model: Usuario, as: 'psicologo', attributes: ['nome'] }],
      order: [['data_hora_inicio','ASC']],
    });
    if (!sessao) return res.status(404).json({ erro: 'Nenhuma sessão futura encontrada.' });

    await enviarLembretesessao({
      nomePaciente:  paciente.usuario?.nome,
      emailPaciente: paciente.usuario?.email,
      nomePsicologo: sessao.psicologo?.nome,
      dataHora:      sessao.data_hora_inicio,
      modalidade:    sessao.modalidade,
    });
    return res.json({ mensagem: `Lembrete enviado para ${paciente.usuario?.email}` });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ erro: 'Erro ao enviar lembrete: ' + e.message });
  }
});

module.exports = router;
