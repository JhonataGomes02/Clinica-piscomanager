const { Prontuario, EvolucaoSessao, Sessao, Usuario, Paciente } = require('../models');

async function buscar(req, res) {
  try {
    const prontuario = await Prontuario.findOne({
      where: { paciente_id: req.params.pacienteId },
      include: [
        { model: EvolucaoSessao, as: 'evolucoes', include: [{ model: Sessao, as: 'sessao' }, { model: Usuario, as: 'psicologo', attributes: ['nome'] }], order: [['criado_em', 'DESC']] }
      ]
    });
    if (!prontuario) return res.status(404).json({ erro: 'Prontuário não encontrado.' });
    res.json(prontuario);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao buscar prontuário.' });
  }
}

async function atualizar(req, res) {
  try {
    const { queixa_principal, historico_familiar, historico_clinico, medicamentos, hipotese_diagnostica, profissao, estado_civil } = req.body;
    const prontuario = await Prontuario.findOne({ where: { paciente_id: req.params.pacienteId } });
    if (!prontuario) return res.status(404).json({ erro: 'Prontuário não encontrado.' });
    await prontuario.update({ queixa_principal, historico_familiar, historico_clinico, medicamentos, hipotese_diagnostica, profissao, estado_civil });
    res.json({ mensagem: 'Prontuário atualizado com sucesso.' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao atualizar prontuário.' });
  }
}

async function adicionarEvolucao(req, res) {
  try {
    const { sessao_id, observacoes_clinicas, status_preenchimento } = req.body;
    const sessao = await Sessao.findByPk(sessao_id);
    if (!sessao) return res.status(404).json({ erro: 'Sessão não encontrada.' });
    const prontuario = await Prontuario.findOne({ where: { paciente_id: sessao.paciente_id } });
    const evolucao = await EvolucaoSessao.create({
      sessao_id, prontuario_id: prontuario.id, psicologo_id: req.usuario.id,
      observacoes_clinicas, status_preenchimento: status_preenchimento || 'completo'
    });
    await Sessao.update({ status: 'realizada' }, { where: { id: sessao_id } });
    res.status(201).json({ mensagem: 'Evolução registrada com sucesso.', id: evolucao.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao registrar evolução.' });
  }
}

async function semProntuario(req, res) {
  try {
    const { Op } = require('sequelize');
    const sessoesSemEvolucao = await Sessao.findAll({
      where: { status: 'realizada' },
      include: [
        { model: EvolucaoSessao, as: 'evolucao', required: false },
        { model: Paciente, as: 'paciente', include: [{ model: Usuario, as: 'usuario', attributes: ['nome'] }] },
        { model: Usuario, as: 'psicologo', attributes: ['nome'] }
      ]
    });
    const pendentes = sessoesSemEvolucao.filter(s => !s.evolucao);
    res.json(pendentes);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar sessões sem prontuário.' });
  }
}

module.exports = { buscar, atualizar, adicionarEvolucao, semProntuario };
