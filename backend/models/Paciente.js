const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Paciente = sequelize.define('Paciente', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  usuario_id: { type: DataTypes.INTEGER, allowNull: false },
  cpf: { type: DataTypes.STRING(14), allowNull: true },
  data_nascimento: { type: DataTypes.DATEONLY, allowNull: true },
  telefone: { type: DataTypes.STRING(20), allowNull: true },
  endereco: { type: DataTypes.TEXT, allowNull: true },
  contato_emergencia: { type: DataTypes.STRING(200), allowNull: true },
  psicologo_id: { type: DataTypes.INTEGER, allowNull: true },
  plano: { type: DataTypes.ENUM('mensal','pacote_5','pacote_10','convenio'), defaultValue: 'mensal' },
  sessoes_plano_restantes: { type: DataTypes.INTEGER, allowNull: true },
  valor_sessao: { type: DataTypes.DECIMAL(10,2), defaultValue: 180.00 },
  status: { type: DataTypes.ENUM('ativo','inativo','suspenso'), defaultValue: 'ativo' }
}, { tableName: 'pacientes' });

module.exports = Paciente;
