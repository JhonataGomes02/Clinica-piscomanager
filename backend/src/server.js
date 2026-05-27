require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const path      = require('path');
const sequelize = require('./config/database');

// Registrar associações (singleton — só executa uma vez)
require('./config/associations')();

// App
const app = express();
app.use(cors({ origin: '*', methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'] }));
app.use(express.json());

const frontendPath = path.join(__dirname, '../../frontend');
app.use(express.static(frontendPath));

// Rotas
app.use('/api/auth',        require('./routes/auth'));
app.use('/api/pacientes',   require('./routes/pacientes'));
app.use('/api/sessoes',     require('./routes/sessoes'));
app.use('/api/prontuarios', require('./routes/prontuarios'));
app.use('/api/financeiro',  require('./routes/financeiro'));
app.use('/api',             require('./routes/misc'));

app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'login.html'));
});

// Conectar ao banco
sequelize.authenticate()
  .then(() => {
    console.log('Conectado ao Supabase!');
    const isVercel = !!(process.env.VERCEL || process.env.NOW_REGION);
    if (!isVercel) {
      const PORT = process.env.PORT || 3033;
      app.listen(PORT, () => console.log(`Rodando em http://localhost:${PORT}/login.html`));
    }
  })
  .catch(err => console.error('Erro ao conectar:', err.message));

module.exports = app;
