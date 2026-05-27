const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middlewares globais
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir frontend estático
app.use(express.static(path.join(__dirname, '../frontend')));

// Rotas da API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/pacientes', require('./routes/pacientes'));
app.use('/api/sessoes', require('./routes/sessoes'));
app.use('/api/prontuarios', require('./routes/prontuarios'));
app.use('/api/financeiro', require('./routes/financeiro'));
app.use('/api/tarefas', require('./routes/tarefas'));
app.use('/api/relatorios', require('./routes/relatorios'));

// Rota catch-all: serve o frontend para qualquer rota não-API
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/login.html'));
});

// Inicialização do banco e servidor
const { sequelize } = require('./models');
const PORT = process.env.PORT || 3000;

async function iniciar() {
  try {
    await sequelize.authenticate();
    console.log('✅ Banco de dados conectado com sucesso.');
    // sync({ alter: true }) atualiza as tabelas sem apagar dados
    await sequelize.sync({ alter: true });
    console.log('✅ Tabelas sincronizadas.');
    app.listen(PORT, () => {
      console.log(`\n🧠 PsicoManager rodando em http://localhost:${PORT}`);
      console.log(`   Acesse o sistema pelo navegador!\n`);
    });
  } catch (err) {
    console.error('❌ Erro ao conectar ao banco de dados:', err.message);
    console.error('   Verifique as configurações no arquivo .env');
    process.exit(1);
  }
}

iniciar();
