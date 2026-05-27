const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const Paciente = require('../models/Paciente');
const Prontuario = require('../models/Prontuario');

// ── LOGIN ─────────────────────────────────────────────────────
async function login(req, res) {
  try {
    const { email, senha } = req.body;
    if (!email || !senha)
      return res.status(400).json({ erro: 'E-mail e senha são obrigatórios.' });

    const usuario = await Usuario.findOne({ where: { email, ativo: true } });
    if (!usuario)
      return res.status(401).json({ erro: 'Credenciais inválidas.' });

    const ok = await bcrypt.compare(senha, usuario.senha_hash);
    if (!ok)
      return res.status(401).json({ erro: 'Credenciais inválidas.' });

    const token = jwt.sign(
      { id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil },
      process.env.JWT_SECRET || 'psicomanager_secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    return res.json({
      token,
      usuario: {
        id: usuario.id, nome: usuario.nome,
        email: usuario.email, perfil: usuario.perfil, crp: usuario.crp
      }
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
}

// ── CADASTRAR (admin cria outro usuário) ──────────────────────
async function cadastrar(req, res) {
  try {
    const { nome, email, senha, perfil, crp } = req.body;
    if (!nome || !email || !senha)
      return res.status(400).json({ erro: 'Nome, e-mail e senha são obrigatórios.' });

    const existe = await Usuario.findOne({ where: { email } });
    if (existe)
      return res.status(409).json({ erro: 'E-mail já cadastrado.' });

    const senha_hash = await bcrypt.hash(senha, 10);
    const novo = await Usuario.create({ nome, email, senha_hash, perfil: perfil || 'paciente', crp });
    return res.status(201).json({ id: novo.id, nome: novo.nome, email: novo.email, perfil: novo.perfil });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
}

// ── REGISTRAR (auto-cadastro público) ────────────────────────
async function registrar(req, res) {
  try {
    const { nome, email, senha, perfil, crp } = req.body;

    if (!nome || !email || !senha)
      return res.status(400).json({ erro: 'Nome, e-mail e senha são obrigatórios.' });

    if (senha.length < 6)
      return res.status(400).json({ erro: 'A senha deve ter no mínimo 6 caracteres.' });

    const existe = await Usuario.findOne({ where: { email } });
    if (existe)
      return res.status(409).json({ erro: 'Este e-mail já está cadastrado.' });

    const senha_hash = await bcrypt.hash(senha, 10);
    const perfilFinal = ['psicologo','administrador','paciente'].includes(perfil) ? perfil : 'paciente';

    const usuario = await Usuario.create({
      nome, email, senha_hash,
      perfil: perfilFinal,
      crp: perfilFinal === 'psicologo' ? crp : null
    });

    // Se for paciente, criar registro na tabela pacientes + prontuário
    if (perfilFinal === 'paciente') {
      const paciente = await Paciente.create({ usuario_id: usuario.id });
      await Prontuario.create({ paciente_id: paciente.id });
    }

    return res.status(201).json({
      mensagem: 'Conta criada com sucesso!',
      usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil }
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ erro: 'Erro interno no servidor.' });
  }
}

module.exports = { login, cadastrar, registrar };
