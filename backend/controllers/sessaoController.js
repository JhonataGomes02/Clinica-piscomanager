const { Sessao, Paciente, Usuario, Sala, EvolucaoSessao } = require('../models');
const { Op } = require('sequelize');

async function listar(req, res) {
  try {
    const { data_inicio, data_fim, psicologo_id, status } = req.query;
    const where = {};

    // Psicólogo vê só as próprias sessões
    if (req.usuario.perfil === 'psicologo') {
      where.psicologo_id = req.usuario.id;
    }
    // Paciente vê SOMENTE as sessões dele
    else if (req.usuario.perfil === 'paciente') {
      const Paciente = require('../models/Paciente');
      const paciente = await Paciente.findOne({ where: { usuario_id: req.usuario.id } });
      if (!paciente) return res.json([]);
      where.paciente_id = paciente.id;
    }
    // Admin vê tudo (com filtro opcional)
    else if (psicologo_id) {
      where.psicologo_id = psicologo_id;
    }

    if (status) where.status = status;
    if (data_inicio && data_fim)
      where.data_hora_inicio = { [Op.between]: [new Date(data_inicio), new Date(data_fim)] };

    const sessoes = await Sessao.findAll({
      where,
      include: [
        { model: Paciente, as: 'paciente', include: [{ model: Usuario, as: 'usuario', attributes: ['nome'] }] },
        { model: Usuario,  as: 'psicologo', attributes: ['nome'] },
      ],
      order: [['data_hora_inicio', 'ASC']],
    });

    return res.json(sessoes);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ erro: 'Erro ao listar sessões.' });
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
    const inicio = new Date(); inicio.setHours(0,0,0,0);
    const fim    = new Date(); fim.setHours(23,59,59,999);
    const where  = { data_hora_inicio: { [Op.between]: [inicio, fim] } };

    if (req.usuario.perfil === 'psicologo') {
      where.psicologo_id = req.usuario.id;
    } else if (req.usuario.perfil === 'paciente') {
      const Paciente = require('../models/Paciente');
      const paciente = await Paciente.findOne({ where: { usuario_id: req.usuario.id } });
      if (!paciente) return res.json([]);
      where.paciente_id = paciente.id;
    }

    const sessoes = await Sessao.findAll({
      where,
      include: [
        { model: Paciente, as: 'paciente', include: [{ model: Usuario, as: 'usuario', attributes: ['nome'] }] },
        { model: Usuario,  as: 'psicologo', attributes: ['nome'] },
      ],
      order: [['data_hora_inicio', 'ASC']],
    });
    return res.json(sessoes);
  } catch (e) {
    return res.status(500).json({ erro: 'Erro ao buscar sessões de hoje.' });
  }
}
module.exports = { listar, criar, atualizarStatus, hoje };
