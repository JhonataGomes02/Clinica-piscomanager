const { Sessao, Paciente, Usuario, Sala, EvolucaoSessao } = require('../models');
const { Op } = require('sequelize');

async function listar(req, res) {
  try {
    const { mes, ano, psicologo_id, status } = req.query;
    const where = {};
    if (status) where.status = status;
    if (psicologo_id) where.psicologo_id = psicologo_id;
    else if (req.usuario.perfil === 'psicologo') where.psicologo_id = req.usuario.id;
    if (mes && ano) {
      const inicio = new Date(ano, mes - 1, 1);
      const fim = new Date(ano, mes, 0, 23, 59, 59);
      where.data_hora_inicio = { [Op.between]: [inicio, fim] };
    }
    const sessoes = await Sessao.findAll({
      where,
      include: [
        { model: Paciente, as: 'paciente', include: [{ model: Usuario, as: 'usuario', attributes: ['nome', 'email'] }] },
        { model: Usuario, as: 'psicologo', attributes: ['nome', 'crp'] },
        { model: Sala, as: 'sala' }
      ],
      order: [['data_hora_inicio', 'ASC']]
    });
    res.json(sessoes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao listar sessões.' });
  }
}

async function criar(req, res) {
  try {
    const { paciente_id, psicologo_id, sala_id, data_hora_inicio, data_hora_fim, modalidade, observacoes } = req.body;
    // Verificar conflito de sala
    if (sala_id) {
      const conflito = await Sessao.findOne({
        where: {
          sala_id,
          status: { [Op.notIn]: ['cancelada'] },
          data_hora_inicio: { [Op.lt]: data_hora_fim || new Date(new Date(data_hora_inicio).getTime() + 60*60*1000) },
          data_hora_fim: { [Op.gt]: data_hora_inicio }
        }
      });
      if (conflito) return res.status(409).json({ erro: 'Conflito de horário na sala selecionada.' });
    }
    const sessao = await Sessao.create({ paciente_id, psicologo_id, sala_id, data_hora_inicio, data_hora_fim, modalidade, observacoes });
    res.status(201).json({ mensagem: 'Sessão agendada com sucesso.', id: sessao.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao criar sessão.' });
  }
}

async function atualizarStatus(req, res) {
  try {
    const sessao = await Sessao.findByPk(req.params.id);
    if (!sessao) return res.status(404).json({ erro: 'Sessão não encontrada.' });
    await sessao.update({ status: req.body.status });
    res.json({ mensagem: 'Status atualizado com sucesso.' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao atualizar sessão.' });
  }
}

async function hoje(req, res) {
  try {
    const hoje = new Date();
    const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 0, 0, 0);
    const fim = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59);
    const where = { data_hora_inicio: { [Op.between]: [inicio, fim] } };
    if (req.usuario.perfil === 'psicologo') where.psicologo_id = req.usuario.id;
    const sessoes = await Sessao.findAll({
      where,
      include: [
        { model: Paciente, as: 'paciente', include: [{ model: Usuario, as: 'usuario', attributes: ['nome'] }] },
        { model: Sala, as: 'sala' }
      ],
      order: [['data_hora_inicio', 'ASC']]
    });
    res.json(sessoes);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar sessões de hoje.' });
  }
}

module.exports = { listar, criar, atualizarStatus, hoje };
