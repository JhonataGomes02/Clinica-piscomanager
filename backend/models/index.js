const sequelize = require('../config/database');
const Usuario = require('./Usuario');
const Paciente = require('./Paciente');
const Sessao = require('./Sessao');
const Prontuario = require('./Prontuario');
const EvolucaoSessao = require('./EvolucaoSessao');
const Pagamento = require('./Pagamento');
const Sala = require('./Sala');
const Tarefa = require('./Tarefa');

// Associações
Usuario.hasOne(Paciente, { foreignKey: 'usuario_id', as: 'dadosPaciente' });
Paciente.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });

Usuario.hasMany(Sessao, { foreignKey: 'psicologo_id', as: 'sessoesComoPsicologo' });
Paciente.hasMany(Sessao, { foreignKey: 'paciente_id', as: 'sessoes' });
Sessao.belongsTo(Paciente, { foreignKey: 'paciente_id', as: 'paciente' });
Sessao.belongsTo(Usuario, { foreignKey: 'psicologo_id', as: 'psicologo' });
Sessao.belongsTo(Sala, { foreignKey: 'sala_id', as: 'sala' });

Paciente.hasOne(Prontuario, { foreignKey: 'paciente_id', as: 'prontuario' });
Prontuario.belongsTo(Paciente, { foreignKey: 'paciente_id', as: 'paciente' });

Prontuario.hasMany(EvolucaoSessao, { foreignKey: 'prontuario_id', as: 'evolucoes' });
Sessao.hasOne(EvolucaoSessao, { foreignKey: 'sessao_id', as: 'evolucao' });
EvolucaoSessao.belongsTo(Sessao, { foreignKey: 'sessao_id', as: 'sessao' });
EvolucaoSessao.belongsTo(Prontuario, { foreignKey: 'prontuario_id', as: 'prontuario' });
EvolucaoSessao.belongsTo(Usuario, { foreignKey: 'psicologo_id', as: 'psicologo' });

Sessao.hasOne(Pagamento, { foreignKey: 'sessao_id', as: 'pagamento' });
Pagamento.belongsTo(Sessao, { foreignKey: 'sessao_id', as: 'sessao' });
Pagamento.belongsTo(Paciente, { foreignKey: 'paciente_id', as: 'paciente' });

Tarefa.belongsTo(Paciente, { foreignKey: 'paciente_id', as: 'paciente' });
Tarefa.belongsTo(Usuario, { foreignKey: 'responsavel_id', as: 'responsavel' });

module.exports = { sequelize, Usuario, Paciente, Sessao, Prontuario, EvolucaoSessao, Pagamento, Sala, Tarefa };
