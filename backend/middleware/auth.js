const jwt = require('jsonwebtoken');
require('dotenv').config();

function autenticar(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ erro: 'Token não fornecido.' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'psicomanager_secret');
    req.usuario = payload;
    next();
  } catch {
    return res.status(401).json({ erro: 'Token inválido ou expirado.' });
  }
}

function autorizar(...perfis) {
  return (req, res, next) => {
    if (!perfis.includes(req.usuario.perfil)) {
      return res.status(403).json({ erro: 'Acesso negado para este perfil.' });
    }
    next();
  };
}

module.exports = { autenticar, autorizar };
