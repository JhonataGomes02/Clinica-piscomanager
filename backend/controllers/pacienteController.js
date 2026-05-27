const { Paciente, Usuario, Prontuario } = require('../models');

async function listar(req, res) {
  try {
    const { status, busca } = req.query;
    const where = {};
    if (status) where.status = status;
    const pacientes = await Paciente.findAll({
      where,
      include: [
        { model: Usuario, as: 'usuario', attributes: ['nome', 'email'] }
      ],
      order: [[{ model: Usuario, as: 'usuario' }, 'nome', 'ASC']]
    });
    const resultado = pacientes.filter(p => {
      if (!busca) return true;
      return p.usuario.nome.toLowerCase().includes(busca.toLowerCase()) ||
             (p.usuario.email && p.usuario.email.toLowerCase().includes(busca.toLowerCase()));
    });
    res.json(resultado);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao listar pacientes.' });
  }
}

async function buscarPorId(req, res) {
  try {
    const paciente = await Paciente.findByPk(req.params.id, {
      include: [
        { model: Usuario, as: 'usuario', attributes: ['nome', 'email'] },
        { model: Prontuario, as: 'prontuario' }
      ]
    });
    if (!paciente) return res.status(404).json({ erro: 'Paciente não encontrado.' });
    res.json(paciente);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar paciente.' });
  }
}

async function criar(req, res) {
  try {
    const { nome, email, senha, cpf, data_nascimento, telefone, endereco,
            contato_emergencia, psicologo_id, plano, valor_sessao } = req.body;
    const bcrypt = require('bcryptjs');
    const senha_hash = await bcrypt.hash(senha || '123456', 12);
    const usuario = await Usuario.create({ nome, email, senha_hash, perfil: 'paciente' });
    const paciente = await Paciente.create({
      usuario_id: usuario.id, cpf, data_nascimento, telefone, endereco,
      contato_emergencia, psicologo_id, plano, valor_sessao
    });
    await Prontuario.create({ paciente_id: paciente.id });
    res.status(201).json({ mensagem: 'Paciente cadastrado com sucesso.', id: paciente.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao criar paciente.' });
  }
}

async function atualizar(req, res) {
  try {
    const paciente = await Paciente.findByPk(req.params.id);
    if (!paciente) return res.status(404).json({ erro: 'Paciente não encontrado.' });
    const { nome, email, cpf, data_nascimento, telefone, endereco, contato_emergencia, plano, valor_sessao, status } = req.body;
    if (nome || email) {
      await Usuario.update({ nome, email }, { where: { id: paciente.usuario_id } });
    }
    await paciente.update({ cpf, data_nascimento, telefone, endereco, contato_emergencia, plano, valor_sessao, status });
    res.json({ mensagem: 'Paciente atualizado com sucesso.' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao atualizar paciente.' });
  }
}

module.exports = { listar, buscarPorId, criar, atualizar };
