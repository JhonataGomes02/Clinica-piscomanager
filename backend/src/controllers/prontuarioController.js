const Prontuario = require('../models/Prontuario');
const Evolucao   = require('../models/Evolucao');
const Usuario    = require('../models/Usuario');

async function buscar(req, res) {
  try {
    const p = await Prontuario.findOne({ where: { paciente_id: req.params.pacienteId } });
    if (!p) return res.status(404).json({ erro: 'Prontuário não encontrado.' });
    return res.json(p);
  } catch (e) {
    return res.status(500).json({ erro: 'Erro ao buscar prontuário.' });
  }
}

async function salvar(req, res) {
  try {
    const { queixa_principal, historico_familiar, historico_clinico,
            medicamentos, hipotese_diagnostica } = req.body;
    const paciente_id = req.params.pacienteId;

    let p = await Prontuario.findOne({ where: { paciente_id } });
    if (p) {
      await p.update({ queixa_principal, historico_familiar, historico_clinico,
                       medicamentos, hipotese_diagnostica, atualizado_em: new Date() });
    } else {
      p = await Prontuario.create({ paciente_id, queixa_principal, historico_familiar,
                                    historico_clinico, medicamentos, hipotese_diagnostica });
    }
    return res.json({ mensagem: 'Prontuário salvo com sucesso.', id: p.id });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ erro: 'Erro ao salvar prontuário.' });
  }
}

async function listarEvolucoes(req, res) {
  try {
    const p = await Prontuario.findOne({ where: { paciente_id: req.params.pacienteId } });
    if (!p) return res.status(404).json({ erro: 'Prontuário não encontrado.' });

    const evolucoes = await Evolucao.findAll({
      where: { prontuario_id: p.id },
      include: [{ model: Usuario, as: 'psicologo', attributes: ['nome'] }],
      order: [['criado_em','DESC']],
    });
    return res.json(evolucoes);
  } catch (e) {
    return res.status(500).json({ erro: 'Erro ao listar evoluções.' });
  }
}

async function adicionarEvolucao(req, res) {
  try {
    const { sessao_id, observacoes_clinicas, status_preenchimento } = req.body;
    const p = await Prontuario.findOne({ where: { paciente_id: req.params.pacienteId } });
    if (!p) return res.status(404).json({ erro: 'Prontuário não encontrado.' });

    const ev = await Evolucao.create({
      sessao_id, prontuario_id: p.id,
      observacoes_clinicas, psicologo_id: req.usuario.id,
      status_preenchimento: status_preenchimento || 'completo',
    });
    return res.status(201).json(ev);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ erro: 'Erro ao adicionar evolução.' });
  }
}

module.exports = { buscar, salvar, listarEvolucoes, adicionarEvolucao };
