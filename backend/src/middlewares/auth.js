const jwt = require('jsonwebtoken');

function autenticar(req, res, next) {
  const header = req.headers['authorization'];
  if (!header) return res.status(401).json({ erro: 'Token não informado.' });

  const token = header.split(' ')[1];
  if (!token) return res.status(401).json({ erro: 'Token mal formatado.' });

  try {
    const dados = jwt.verify(token, process.env.JWT_SECRET || 'psicomanager_secret');
    req.usuario = dados;
    next();
  } catch (e) {
    return res.status(401).json({ erro: 'Token inválido ou expirado.' });
  }
}

function apenasAdmin(req, res, next) {
  if (req.usuario.perfil !== 'administrador')
    return res.status(403).json({ erro: 'Acesso restrito ao administrador.' });
  next();
}

function apenasPsicologo(req, res, next) {
  if (!['psicologo','administrador'].includes(req.usuario.perfil))
    return res.status(403).json({ erro: 'Acesso restrito ao psicólogo.' });
  next();
}

module.exports = { autenticar, apenasAdmin, apenasPsicologo };
