const express = require('express');
const router  = express.Router();
const { autenticar } = require('../middlewares/auth');
const GoogleToken    = require('../models/GoogleToken');
const Sessao         = require('../models/Sessao');
const Paciente       = require('../models/Paciente');
const Usuario        = require('../models/Usuario');
const gc = require('../services/googleCalendarService');

// Verificar se Google Calendar está configurado
function googleConfigurado() {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

// Status da conexão do usuário com Google Calendar
router.get('/status', autenticar, async (req, res) => {
  if (!googleConfigurado())
    return res.json({ conectado: false, erro: 'Google Calendar não configurado no servidor.' });

  try {
    const token = await GoogleToken.findOne({ where: { usuario_id: req.usuario.id } });
    return res.json({ conectado: !!token, email: token ? 'Conectado' : null });
  } catch (e) {
    return res.json({ conectado: false });
  }
});

// Iniciar fluxo OAuth — redireciona para o Google
router.get('/conectar', autenticar, (req, res) => {
  if (!googleConfigurado())
    return res.status(501).json({ erro: 'Variáveis GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET não configuradas.' });

  // Salvar token JWT no estado para recuperar depois do callback
  const url = gc.gerarUrlAutorizacao();
  return res.json({ url });
});

// Callback do Google OAuth
router.get('/callback', async (req, res) => {
  const { code, state } = req.query;

  if (!code)
    return res.redirect('/index.html?google=erro');

  try {
    const tokens = await gc.trocarCodigoPorTokens(code);

    // Recuperar usuário pelo token JWT na query
    const jwt = require('jsonwebtoken');
    const jwtToken = req.query.state;
    let usuarioId;
    try {
      const dados = jwt.verify(jwtToken, process.env.JWT_SECRET || 'psicomanager_secret');
      usuarioId = dados.id;
    } catch (e) {
      return res.redirect('/index.html?google=erro_token');
    }

    // Salvar ou atualizar tokens no banco
    await GoogleToken.upsert({
      usuario_id:    usuarioId,
      access_token:  tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date:   tokens.expiry_date,
      atualizado_em: new Date(),
    });

    return res.redirect('/index.html?google=conectado');
  } catch (e) {
    console.error('Erro no callback Google:', e.message);
    return res.redirect('/index.html?google=erro');
  }
});

// Desconectar Google Calendar
router.delete('/desconectar', autenticar, async (req, res) => {
  try {
    await GoogleToken.destroy({ where: { usuario_id: req.usuario.id } });
    return res.json({ mensagem: 'Google Calendar desconectado.' });
  } catch (e) {
    return res.status(500).json({ erro: 'Erro ao desconectar.' });
  }
});

// Sincronizar sessão com Google Calendar
router.post('/sincronizar/:sessaoId', autenticar, async (req, res) => {
  try {
    const tokenRow = await GoogleToken.findOne({ where: { usuario_id: req.usuario.id } });
    if (!tokenRow)
      return res.status(401).json({ erro: 'Google Calendar não conectado. Conecte primeiro.' });

    const sessao = await Sessao.findByPk(req.params.sessaoId, {
      include: [
        { model: Paciente, as: 'paciente', include: [{ model: Usuario, as: 'usuario', attributes: ['nome'] }] },
        { model: Usuario,  as: 'psicologo', attributes: ['nome'] },
      ]
    });
    if (!sessao) return res.status(404).json({ erro: 'Sessão não encontrada.' });

    const tokens = {
      access_token:  tokenRow.access_token,
      refresh_token: tokenRow.refresh_token,
      expiry_date:   tokenRow.expiry_date,
    };

    const evento = await gc.criarEvento(tokens, {
      nomePaciente:  sessao.paciente?.usuario?.nome || 'Paciente',
      nomePsicologo: sessao.psicologo?.nome || 'Psicólogo',
      dataInicio:    sessao.data_hora_inicio,
      dataFim:       sessao.data_hora_fim,
      modalidade:    sessao.modalidade,
      observacoes:   sessao.observacoes,
    });

    // Salvar o ID do evento Google na sessão
    await sessao.update({ observacoes: (sessao.observacoes || '') + `\n[google_event_id:${evento.id}]` });

    return res.json({ mensagem: 'Sessão sincronizada com Google Calendar!', eventoId: evento.id });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ erro: 'Erro ao sincronizar: ' + e.message });
  }
});

// Sincronizar TODAS as sessões futuras de uma vez
router.post('/sincronizar-todas', autenticar, async (req, res) => {
  try {
    const tokenRow = await GoogleToken.findOne({ where: { usuario_id: req.usuario.id } });
    if (!tokenRow)
      return res.status(401).json({ erro: 'Google Calendar não conectado.' });

    const { Op } = require('sequelize');
    const sessoes = await Sessao.findAll({
      where: {
        psicologo_id:    req.usuario.id,
        data_hora_inicio: { [Op.gte]: new Date() },
        status:          { [Op.in]: ['agendada', 'confirmada'] },
      },
      include: [
        { model: Paciente, as: 'paciente', include: [{ model: Usuario, as: 'usuario', attributes: ['nome'] }] },
        { model: Usuario,  as: 'psicologo', attributes: ['nome'] },
      ]
    });

    const tokens = {
      access_token:  tokenRow.access_token,
      refresh_token: tokenRow.refresh_token,
      expiry_date:   tokenRow.expiry_date,
    };

    let sincronizadas = 0;
    for (const sessao of sessoes) {
      try {
        await gc.criarEvento(tokens, {
          nomePaciente:  sessao.paciente?.usuario?.nome || 'Paciente',
          nomePsicologo: sessao.psicologo?.nome || 'Psicólogo',
          dataInicio:    sessao.data_hora_inicio,
          dataFim:       sessao.data_hora_fim,
          modalidade:    sessao.modalidade,
          observacoes:   sessao.observacoes,
        });
        sincronizadas++;
      } catch (e) {
        console.error(`Erro na sessão ${sessao.id}:`, e.message);
      }
    }

    return res.json({ mensagem: `${sincronizadas} sessão(ões) sincronizada(s) com sucesso!` });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ erro: 'Erro ao sincronizar: ' + e.message });
  }
});

module.exports = router;
