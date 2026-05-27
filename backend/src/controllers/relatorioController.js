const Sessao    = require('../models/Sessao');
const Paciente  = require('../models/Paciente');
const Usuario   = require('../models/Usuario');
const Evolucao  = require('../models/Evolucao');
const Pagamento = require('../models/Pagamento');
const sequelize = require('../config/database');
const { Op, fn, col } = require('sequelize');

async function dashboard(req, res) {
  try {
    const hoje_ini = new Date(); hoje_ini.setHours(0,0,0,0);
    const hoje_fim = new Date(); hoje_fim.setHours(23,59,59,999);

    const whereHoje = { data_hora_inicio: { [Op.between]: [hoje_ini, hoje_fim] } };
    if (req.usuario.perfil === 'psicologo') whereHoje.psicologo_id = req.usuario.id;

    const sessoesHoje = await Sessao.count({ where: whereHoje });
    const totalPacientes = await Paciente.count();

    const agora   = new Date();
    const mes_ini = new Date(agora.getFullYear(), agora.getMonth(), 1);
    const mes_fim = new Date(agora.getFullYear(), agora.getMonth() + 1, 0, 23, 59, 59);

    const receitaMes = await Pagamento.sum('valor', {
      where: { status: 'pago', data_pagamento: { [Op.between]: [mes_ini, mes_fim] } }
    });

    const sessoesConfirmadas = await Sessao.count({
      where: { data_hora_inicio: { [Op.between]: [mes_ini, mes_fim] }, status: 'confirmada' }
    });
    const sessoesTotal = await Sessao.count({
      where: { data_hora_inicio: { [Op.between]: [mes_ini, mes_fim] } }
    });
    const taxaPresenca = sessoesTotal > 0
      ? Math.round((sessoesConfirmadas / sessoesTotal) * 100) : 0;

    return res.json({
      sessoes_hoje:     sessoesHoje,
      pacientes_ativos: totalPacientes,
      receita_mes:      receitaMes || 0,
      taxa_presenca:    taxaPresenca,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ erro: 'Erro ao gerar dashboard.' });
  }
}

async function prontuariosPendentes(req, res) {
  try {
    const limite = new Date();
    limite.setDate(limite.getDate() - 30);

    const sessoes = await Sessao.findAll({
      where: { status: 'realizada', data_hora_inicio: { [Op.gte]: limite } },
      include: [
        { model: Paciente, as: 'paciente', include: [{ model: Usuario, as: 'usuario', attributes: ['nome'] }] },
        { model: Usuario,  as: 'psicologo', attributes: ['nome'] },
      ],
    });

    const idsComEvolucao = (await Evolucao.findAll({ attributes: ['sessao_id'] }))
      .map(e => e.sessao_id);

    const pendentes = sessoes.filter(s => !idsComEvolucao.includes(s.id));
    return res.json(pendentes);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ erro: 'Erro ao buscar prontuários pendentes.' });
  }
}

async function atendimentosPorProfissional(req, res) {
  try {
    const agora   = new Date();
    const mes_ini = new Date(agora.getFullYear(), agora.getMonth(), 1);
    const mes_fim = new Date(agora.getFullYear(), agora.getMonth() + 1, 0, 23, 59, 59);

    // PostgreSQL: GROUP BY com alias via subquery
    const rows = await sequelize.query(`
      SELECT u.nome, COUNT(s.id)::int AS total
      FROM sessoes s
      JOIN usuarios u ON u.id = s.psicologo_id
      WHERE s.data_hora_inicio BETWEEN :inicio AND :fim
      GROUP BY u.id, u.nome
      ORDER BY total DESC
    `, {
      replacements: { inicio: mes_ini, fim: mes_fim },
      type: sequelize.QueryTypes.SELECT,
    });

    return res.json(rows);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ erro: 'Erro ao gerar relatório.' });
  }
}

module.exports = { dashboard, prontuariosPendentes, atendimentosPorProfissional };
