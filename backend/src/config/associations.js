// Garante que as associações só são registradas UMA vez
let associacoesRegistradas = false;

function registrarAssociacoes() {
  if (associacoesRegistradas) return;
  associacoesRegistradas = true;

  const Usuario    = require('./models/Usuario');
  const Paciente   = require('./models/Paciente');
  const Sessao     = require('./models/Sessao');
  const Prontuario = require('./models/Prontuario');
  const Evolucao   = require('./models/Evolucao');
  const Pagamento  = require('./models/Pagamento');
  const Tarefa     = require('./models/Tarefa');

  Paciente.belongsTo(Usuario,  { foreignKey: 'usuario_id',   as: 'usuario' });
  Paciente.belongsTo(Usuario,  { foreignKey: 'psicologo_id', as: 'psicologo' });
  Usuario.hasMany   (Paciente, { foreignKey: 'usuario_id',   as: 'perfil_paciente' });

  Sessao.belongsTo(Paciente, { foreignKey: 'paciente_id',  as: 'paciente' });
  Sessao.belongsTo(Usuario,  { foreignKey: 'psicologo_id', as: 'psicologo' });
  Paciente.hasMany (Sessao,  { foreignKey: 'paciente_id',  as: 'sessoes' });

  Prontuario.belongsTo(Paciente, { foreignKey: 'paciente_id', as: 'paciente' });
  Paciente.hasOne (Prontuario,   { foreignKey: 'paciente_id', as: 'prontuario' });

  Evolucao.belongsTo(Sessao,     { foreignKey: 'sessao_id',     as: 'sessao' });
  Evolucao.belongsTo(Prontuario, { foreignKey: 'prontuario_id', as: 'prontuario' });
  Evolucao.belongsTo(Usuario,    { foreignKey: 'psicologo_id',  as: 'psicologo' });

  Pagamento.belongsTo(Sessao,   { foreignKey: 'sessao_id',   as: 'sessao' });
  Pagamento.belongsTo(Paciente, { foreignKey: 'paciente_id', as: 'paciente' });

  Tarefa.belongsTo(Paciente, { foreignKey: 'paciente_id',    as: 'paciente' });
  Tarefa.belongsTo(Usuario,  { foreignKey: 'responsavel_id', as: 'responsavel' });
}

module.exports = registrarAssociacoes;
