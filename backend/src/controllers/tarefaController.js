const Tarefa   = require('../models/Tarefa');
const Paciente = require('../models/Paciente');
const Usuario  = require('../models/Usuario');

async function listar(req, res) {
  try {
    const where = {};
    if (req.usuario.perfil === 'psicologo') where.responsavel_id = req.usuario.id;

    const tarefas = await Tarefa.findAll({
      where,
      include: [
        { model: Paciente, as: 'paciente', include: [{ model: Usuario, as: 'usuario', attributes: ['nome'] }] },
        { model: Usuario,  as: 'responsavel', attributes: ['nome'] },
      ],
      order: [['prazo','ASC']],
    });
    return res.json(tarefas);
  } catch (e) {
    return res.status(500).json({ erro: 'Erro ao listar tarefas.' });
  }
}

async function criar(req, res) {
  try {
    const { descricao, paciente_id, responsavel_id, prazo } = req.body;
    if (!descricao) return res.status(400).json({ erro: 'Descrição é obrigatória.' });

    const t = await Tarefa.create({
      descricao, paciente_id, prazo,
      responsavel_id: responsavel_id || req.usuario.id,
    });
    return res.status(201).json(t);
  } catch (e) {
    return res.status(500).json({ erro: 'Erro ao criar tarefa.' });
  }
}

async function concluir(req, res) {
  try {
    const t = await Tarefa.findByPk(req.params.id);
    if (!t) return res.status(404).json({ erro: 'Tarefa não encontrada.' });
    await t.update({ concluida: !t.concluida });
    return res.json({ concluida: t.concluida });
  } catch (e) {
    return res.status(500).json({ erro: 'Erro ao atualizar tarefa.' });
  }
}

module.exports = { listar, criar, concluir };
