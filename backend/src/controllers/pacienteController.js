const Paciente  = require('../models/Paciente');
const Usuario   = require('../models/Usuario');
const Prontuario = require('../models/Prontuario');
const bcrypt    = require('bcryptjs');

async function listar(req, res) {
  try {
    const { busca, status } = req.query;
    const where = {};

    const pacientes = await Paciente.findAll({
      include: [
        { model: Usuario, as: 'usuario',    attributes: ['nome','email'] },
        { model: Usuario, as: 'psicologo',  attributes: ['nome'] },
      ],
      order: [['criado_em','DESC']],
    });

    let resultado = pacientes.map(p => ({
      id:          p.id,
      nome:        p.usuario?.nome,
      email:       p.usuario?.email,
      telefone:    p.telefone,
      plano:       p.plano,
      psicologo:   p.psicologo?.nome,
      saldo:       p.saldo_sessoes,
      criado_em:   p.criado_em,
    }));

    if (busca) {
      const b = busca.toLowerCase();
      resultado = resultado.filter(p =>
        p.nome?.toLowerCase().includes(b) || p.email?.toLowerCase().includes(b)
      );
    }

    return res.json(resultado);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ erro: 'Erro ao listar pacientes.' });
  }
}

async function buscarPorId(req, res) {
  try {
    const p = await Paciente.findByPk(req.params.id, {
      include: [
        { model: Usuario, as: 'usuario',   attributes: ['nome','email'] },
        { model: Usuario, as: 'psicologo', attributes: ['nome'] },
      ]
    });
    if (!p) return res.status(404).json({ erro: 'Paciente não encontrado.' });
    return res.json(p);
  } catch (e) {
    return res.status(500).json({ erro: 'Erro ao buscar paciente.' });
  }
}

async function criar(req, res) {
  try {
    const { nome, email, senha, cpf, data_nascimento, telefone, endereco,
            contato_emergencia, profissao, psicologo_id, plano } = req.body;

    if (!nome || !email)
      return res.status(400).json({ erro: 'Nome e e-mail são obrigatórios.' });

    const existe = await Usuario.findOne({ where: { email } });
    if (existe) return res.status(409).json({ erro: 'E-mail já cadastrado.' });

    const senha_hash = await bcrypt.hash(senha || '123456', 10);
    const usuario = await Usuario.create({ nome, email, senha_hash, perfil: 'paciente' });

    const saldo = plano === 'pacote_5' ? 5 : plano === 'pacote_10' ? 10 : null;
    const paciente = await Paciente.create({
      usuario_id: usuario.id, cpf, data_nascimento, telefone,
      endereco, contato_emergencia, profissao, psicologo_id,
      plano: plano || 'particular_mensal', saldo_sessoes: saldo
    });

    await Prontuario.create({ paciente_id: paciente.id });

    return res.status(201).json({ id: paciente.id, nome, email });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ erro: 'Erro ao cadastrar paciente.' });
  }
}

async function atualizar(req, res) {
  try {
    const paciente = await Paciente.findByPk(req.params.id);
    if (!paciente) return res.status(404).json({ erro: 'Paciente não encontrado.' });

    const { cpf, data_nascimento, telefone, endereco, contato_emergencia,
            profissao, psicologo_id, plano } = req.body;
    await paciente.update({ cpf, data_nascimento, telefone, endereco,
                            contato_emergencia, profissao, psicologo_id, plano });
    return res.json({ mensagem: 'Paciente atualizado com sucesso.' });
  } catch (e) {
    return res.status(500).json({ erro: 'Erro ao atualizar paciente.' });
  }
}

module.exports = { listar, buscarPorId, criar, atualizar };
