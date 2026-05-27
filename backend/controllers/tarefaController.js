const { Tarefa, Paciente, Usuario } = require('../models');

async function listar(req, res) {
  try {
    const where = {};
    if (req.usuario.perfil === 'psicologo') where.responsavel_id = req.usuario.id;
    const tarefas = await Tarefa.findAll({
      where,
      include: [
        { model: Paciente, as: 'paciente', include: [{ model: Usuario, as: 'usuario', attributes: ['nome'] }] },
        { model: Usuario, as: 'responsavel', attributes: ['nome'] }
      ],
      order: [['prazo', 'ASC']]
    });
    res.json(tarefas);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao listar tarefas.' });
  }
}

async function criar(req, res) {
  try {
    const { descricao, paciente_id, responsavel_id, prazo } = req.body;
    const tarefa = await Tarefa.create({ descricao, paciente_id, responsavel_id: responsavel_id || req.usuario.id, prazo });
    res.status(201).json({ mensagem: 'Tarefa criada com sucesso.', id: tarefa.id });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao criar tarefa.' });
  }
}

async function concluir(req, res) {
  try {
    await Tarefa.update({ status: 'concluida' }, { where: { id: req.params.id } });
    res.json({ mensagem: 'Tarefa concluída.' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao concluir tarefa.' });
  }
}

module.exports = { listar, criar, concluir };
