const Convenio = require('../models/Convenio');

async function listar(req, res) {
  try {
    const lista = await Convenio.findAll({ order: [['nome', 'ASC']] });
    return res.json(lista);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ erro: 'Erro ao listar convênios.' });
  }
}

async function criar(req, res) {
  try {
    const { nome, percentual_pago, coparticipacao, valor_referencia, observacoes } = req.body;
    if (!nome || !percentual_pago || !coparticipacao)
      return res.status(400).json({ erro: 'Nome, percentual e coparticipação são obrigatórios.' });

    const c = await Convenio.create({ nome, percentual_pago, coparticipacao, valor_referencia, observacoes });
    return res.status(201).json(c);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ erro: 'Erro ao cadastrar convênio.' });
  }
}

async function atualizar(req, res) {
  try {
    const c = await Convenio.findByPk(req.params.id);
    if (!c) return res.status(404).json({ erro: 'Convênio não encontrado.' });
    await c.update(req.body);
    return res.json({ mensagem: 'Convênio atualizado.' });
  } catch (e) {
    return res.status(500).json({ erro: 'Erro ao atualizar convênio.' });
  }
}

async function remover(req, res) {
  try {
    const c = await Convenio.findByPk(req.params.id);
    if (!c) return res.status(404).json({ erro: 'Convênio não encontrado.' });
    await c.update({ ativo: false });
    return res.json({ mensagem: 'Convênio desativado.' });
  } catch (e) {
    return res.status(500).json({ erro: 'Erro ao remover convênio.' });
  }
}

module.exports = { listar, criar, atualizar, remover };
