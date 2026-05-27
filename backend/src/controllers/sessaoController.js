const Sessao   = require('../models/Sessao');
const Paciente = require('../models/Paciente');
const Usuario  = require('../models/Usuario');
const { Op }   = require('sequelize');

async function listar(req, res) {
  try {
    const { data_inicio, data_fim, psicologo_id, status } = req.query;
    const where = {};

    if (req.usuario.perfil === 'psicologo')
      where.psicologo_id = req.usuario.id;
    else if (psicologo_id)
      where.psicologo_id = psicologo_id;

    if (status)  where.status = status;
    if (data_inicio && data_fim)
      where.data_hora_inicio = { [Op.between]: [new Date(data_inicio), new Date(data_fim)] };

    const sessoes = await Sessao.findAll({
      where,
      include: [
        { model: Paciente, as: 'paciente',  include: [{ model: Usuario, as: 'usuario', attributes: ['nome'] }] },
        { model: Usuario,  as: 'psicologo', attributes: ['nome'] },
      ],
      order: [['data_hora_inicio','ASC']],
    });

    return res.json(sessoes);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ erro: 'Erro ao listar sessões.' });
  }
}

async function criar(req, res) {
  try {
    const { paciente_id, psicologo_id, sala_id, data_hora_inicio,
            data_hora_fim, modalidade, observacoes } = req.body;

    if (!paciente_id || !psicologo_id || !data_hora_inicio || !data_hora_fim)
      return res.status(400).json({ erro: 'Campos obrigatórios: paciente, psicólogo, data/hora.' });

    // Verificar conflito de sala
    if (sala_id) {
      const conflito = await Sessao.findOne({
        where: {
          sala_id,
          status: { [Op.in]: ['agendada','confirmada'] },
          data_hora_inicio: { [Op.lt]: new Date(data_hora_fim) },
          data_hora_fim:    { [Op.gt]: new Date(data_hora_inicio) },
        }
      });
      if (conflito)
        return res.status(409).json({ erro: 'Conflito de horário na sala selecionada.' });
    }

    const sessao = await Sessao.create({
      paciente_id, psicologo_id, sala_id, modalidade: modalidade || 'presencial',
      data_hora_inicio, data_hora_fim, observacoes
    });

    return res.status(201).json(sessao);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ erro: 'Erro ao criar sessão.' });
  }
}

async function atualizarStatus(req, res) {
  try {
    const sessao = await Sessao.findByPk(req.params.id);
    if (!sessao) return res.status(404).json({ erro: 'Sessão não encontrada.' });

    const { status, observacoes } = req.body;
    await sessao.update({ status, observacoes });
    return res.json({ mensagem: 'Status atualizado.', status });
  } catch (e) {
    return res.status(500).json({ erro: 'Erro ao atualizar sessão.' });
  }
}

async function hoje(req, res) {
  try {
    const inicio = new Date(); inicio.setHours(0,0,0,0);
    const fim    = new Date(); fim.setHours(23,59,59,999);
    const where  = { data_hora_inicio: { [Op.between]: [inicio, fim] } };
    if (req.usuario.perfil === 'psicologo') where.psicologo_id = req.usuario.id;

    const sessoes = await Sessao.findAll({
      where,
      include: [
        { model: Paciente, as: 'paciente', include: [{ model: Usuario, as: 'usuario', attributes: ['nome'] }] },
        { model: Usuario,  as: 'psicologo', attributes: ['nome'] },
      ],
      order: [['data_hora_inicio','ASC']],
    });
    return res.json(sessoes);
  } catch (e) {
    return res.status(500).json({ erro: 'Erro ao buscar sessões de hoje.' });
  }
}

module.exports = { listar, criar, atualizarStatus, hoje };
