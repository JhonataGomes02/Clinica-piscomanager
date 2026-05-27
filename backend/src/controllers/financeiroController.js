const Pagamento = require('../models/Pagamento');
const Sessao    = require('../models/Sessao');
const Paciente  = require('../models/Paciente');
const Usuario   = require('../models/Usuario');
const sequelize = require('../config/database');
const { Op, fn, col, literal } = require('sequelize');

async function listar(req, res) {
  try {
    const { mes, ano, status } = req.query;
    const where = {};
    if (status) where.status = status;

    if (mes && ano) {
      const inicio = new Date(ano, mes - 1, 1);
      const fim    = new Date(ano, mes, 0, 23, 59, 59);
      where.criado_em = { [Op.between]: [inicio, fim] };
    }

    const pagamentos = await Pagamento.findAll({
      where,
      include: [
        { model: Paciente, as: 'paciente', include: [{ model: Usuario, as: 'usuario', attributes: ['nome'] }] },
      ],
      order: [['criado_em', 'DESC']],
    });
    return res.json(pagamentos);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ erro: 'Erro ao listar pagamentos.' });
  }
}

async function registrar(req, res) {
  try {
    const { sessao_id, paciente_id, valor, forma_pagamento, data_pagamento, observacoes } = req.body;
    if (!sessao_id || !paciente_id || !valor || !forma_pagamento)
      return res.status(400).json({ erro: 'Campos obrigatórios: sessão, paciente, valor, forma de pagamento.' });

    const p = await Pagamento.create({
      sessao_id, paciente_id, valor,
      forma_pagamento, status: 'pago',
      data_pagamento: data_pagamento || new Date(), observacoes
    });
    return res.status(201).json(p);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ erro: 'Erro ao registrar pagamento.' });
  }
}

async function resumo(req, res) {
  try {
    const agora  = new Date();
    const mes    = parseInt(req.query.mes  || agora.getMonth() + 1);
    const ano    = parseInt(req.query.ano  || agora.getFullYear());
    const inicio = new Date(ano, mes - 1, 1);
    const fim    = new Date(ano, mes, 0, 23, 59, 59);

    const receita = await Pagamento.sum('valor', {
      where: { status: 'pago', data_pagamento: { [Op.between]: [inicio, fim] } }
    });

    const totalSessoes = await Sessao.count({
      where: {
        data_hora_inicio: { [Op.between]: [inicio, fim] },
        status: { [Op.in]: ['realizada', 'confirmada'] }
      }
    });

    const canceladas = await Sessao.count({
      where: { data_hora_inicio: { [Op.between]: [inicio, fim] }, status: 'cancelada' }
    });

    return res.json({
      receita:       receita || 0,
      total_sessoes: totalSessoes,
      canceladas,
      ticket_medio:  totalSessoes > 0 ? ((receita || 0) / totalSessoes).toFixed(2) : 0,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ erro: 'Erro ao gerar resumo financeiro.' });
  }
}

async function receitaMensal(req, res) {
  try {
    const ano = parseInt(req.query.ano || new Date().getFullYear());
    const inicio = new Date(ano, 0, 1);
    const fim    = new Date(ano, 11, 31, 23, 59, 59);

    // PostgreSQL: usar EXTRACT ao invés de MONTH()
    const rows = await sequelize.query(`
      SELECT
        EXTRACT(MONTH FROM data_pagamento)::int AS mes,
        SUM(valor)::float                        AS total
      FROM pagamentos
      WHERE status = 'pago'
        AND data_pagamento BETWEEN :inicio AND :fim
      GROUP BY mes
      ORDER BY mes ASC
    `, {
      replacements: { inicio, fim },
      type: sequelize.QueryTypes.SELECT,
    });

    return res.json(rows);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ erro: 'Erro ao buscar receita mensal.' });
  }
}

module.exports = { listar, registrar, resumo, receitaMensal };
