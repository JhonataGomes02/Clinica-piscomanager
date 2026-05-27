require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const path      = require('path');
const sequelize = require('./config/database');

// Models
const Usuario    = require('./models/Usuario');
const Paciente   = require('./models/Paciente');
const Sessao     = require('./models/Sessao');
const Prontuario = require('./models/Prontuario');
const Evolucao   = require('./models/Evolucao');
const Pagamento  = require('./models/Pagamento');
const Tarefa     = require('./models/Tarefa');
const Convenio   = require('./models/Convenio');

// Associações — só registra uma vez
if (!Paciente.associations.usuario) {
  Paciente.belongsTo(Usuario,  { foreignKey: 'usuario_id',   as: 'usuario' });
  Paciente.belongsTo(Usuario,  { foreignKey: 'psicologo_id', as: 'psicologo' });
  Usuario.hasMany   (Paciente, { foreignKey: 'usuario_id',   as: 'perfil_paciente' });
}
if (!Sessao.associations.paciente) {
  Sessao.belongsTo(Paciente, { foreignKey: 'paciente_id',  as: 'paciente' });
  Sessao.belongsTo(Usuario,  { foreignKey: 'psicologo_id', as: 'psicologo' });
  Paciente.hasMany (Sessao,  { foreignKey: 'paciente_id',  as: 'sessoes' });
}
if (!Prontuario.associations.paciente) {
  Prontuario.belongsTo(Paciente, { foreignKey: 'paciente_id', as: 'paciente' });
  Paciente.hasOne (Prontuario,   { foreignKey: 'paciente_id', as: 'prontuario' });
}
if (!Evolucao.associations.sessao) {
  Evolucao.belongsTo(Sessao,     { foreignKey: 'sessao_id',     as: 'sessao' });
  Evolucao.belongsTo(Prontuario, { foreignKey: 'prontuario_id', as: 'prontuario' });
  Evolucao.belongsTo(Usuario,    { foreignKey: 'psicologo_id',  as: 'psicologo' });
}
if (!Pagamento.associations.sessao) {
  Pagamento.belongsTo(Sessao,   { foreignKey: 'sessao_id',   as: 'sessao' });
  Pagamento.belongsTo(Paciente, { foreignKey: 'paciente_id', as: 'paciente' });
}
if (!Tarefa.associations.paciente) {
  Tarefa.belongsTo(Paciente, { foreignKey: 'paciente_id',    as: 'paciente' });
  Tarefa.belongsTo(Usuario,  { foreignKey: 'responsavel_id', as: 'responsavel' });
}

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

// Iniciar
const isVercel = !!(process.env.VERCEL || process.env.NOW_REGION);

sequelize.authenticate()
  .then(() => {
    console.log('Conectado ao banco!');
    if (!isVercel) {
      const PORT = process.env.PORT || 3033;
      app.listen(PORT, () => console.log(`Rodando em http://localhost:${PORT}/login.html`));
    }
  })
  .catch(err => console.error('Erro ao conectar:', err.message));

module.exports = app;
