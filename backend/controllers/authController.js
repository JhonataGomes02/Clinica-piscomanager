const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Usuario, Paciente } = require('../models');
require('dotenv').config();

async function login(req, res) {
  try {
    const { email, senha } = req.body;
    if (!email || !senha) return res.status(400).json({ erro: 'E-mail e senha são obrigatórios.' });
    const usuario = await Usuario.findOne({ where: { email, ativo: true } });
    if (!usuario) return res.status(401).json({ erro: 'Credenciais inválidas.' });
    const senhaOk = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaOk) return res.status(401).json({ erro: 'Credenciais inválidas.' });
    const token = jwt.sign(
      { id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil, crp: usuario.crp },
      process.env.JWT_SECRET || 'psicomanager_secret',
      { expiresIn: '8h' }
    );
    res.json({ token, usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil, crp: usuario.crp } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
}

async function registrar(req, res) {
  try {
    const { nome, email, senha, perfil, crp, especialidade } = req.body;
    const existe = await Usuario.findOne({ where: { email } });
    if (existe) return res.status(409).json({ erro: 'E-mail já cadastrado.' });
    const senha_hash = await bcrypt.hash(senha, 12);
    const usuario = await Usuario.create({ nome, email, senha_hash, perfil, crp, especialidade });
    if (perfil === 'paciente') await Paciente.create({ usuario_id: usuario.id });
    res.status(201).json({ mensagem: 'Usuário criado com sucesso.', id: usuario.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao registrar usuário.' });
  }
}

module.exports = { login, registrar };
