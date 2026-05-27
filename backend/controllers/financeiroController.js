const { Pagamento, Paciente, Usuario, Sessao } = require('../models');
const { Op, fn, col, literal } = require('sequelize');

async function listar(req, res) {
  try {
    const { mes, ano, tipo, status } = req.query;
    const where = {};
    if (tipo) where.tipo = tipo;
    if (status) where.status = status;
    if (mes && ano) {
      const inicio = new Date(ano, mes - 1, 1);
      const fim = new Date(ano, mes, 0);
      where.criado_em = { [Op.between]: [inicio, fim] };
    }
    const pagamentos = await Pagamento.findAll({
      where,
      include: [
        { model: Paciente, as: 'paciente', include: [{ model: Usuario, as: 'usuario', attributes: ['nome'] }] }
      ],
      order: [['criado_em', 'DESC']]
    });
    res.json(pagamentos);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao listar pagamentos.' });
  }
}

async function registrar(req, res) {
  try {
    const { sessao_id, paciente_id, descricao, valor, tipo, forma_pagamento, status, data_pagamento, categoria_despesa } = req.body;
    const pagamento = await Pagamento.create({ sessao_id, paciente_id, descricao, valor, tipo: tipo || 'receita', forma_pagamento, status: status || 'pago', data_pagamento, categoria_despesa });
    res.status(201).json({ mensagem: 'Pagamento registrado com sucesso.', id: pagamento.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao registrar pagamento.' });
  }
}

async function resumo(req, res) {
  try {
    const agora = new Date();
    const mes = req.query.mes || (agora.getMonth() + 1);
    const ano = req.query.ano || agora.getFullYear();
    const inicio = new Date(ano, mes - 1, 1);
    const fim = new Date(ano, mes, 0, 23, 59, 59);
    const pagamentos = await Pagamento.findAll({ where: { status: 'pago', criado_em: { [Op.between]: [inicio, fim] } } });
    const receitas = pagamentos.filter(p => p.tipo === 'receita').reduce((s, p) => s + parseFloat(p.valor), 0);
    const despesas = pagamentos.filter(p => p.tipo === 'despesa').reduce((s, p) => s + parseFloat(p.valor), 0);
    // Dados para gráfico (últimos 6 meses)
    const grafico = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(ano, mes - 1 - i, 1);
      const mLabel = d.toLocaleDateString('pt-BR', { month: 'short' });
      const iniM = new Date(d.getFullYear(), d.getMonth(), 1);
      const fimM = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      const pags = await Pagamento.findAll({ where: { status: 'pago', criado_em: { [Op.between]: [iniM, fimM] } } });
      grafico.push({
        mes: mLabel,
        receitas: pags.filter(p => p.tipo === 'receita').reduce((s, p) => s + parseFloat(p.valor), 0),
        despesas: pags.filter(p => p.tipo === 'despesa').reduce((s, p) => s + parseFloat(p.valor), 0)
      });
    }
    res.json({ receitas, despesas, saldo: receitas - despesas, grafico });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao calcular resumo financeiro.' });
  }
}

module.exports = { listar, registrar, resumo };
