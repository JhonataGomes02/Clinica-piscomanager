const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EvolucaoSessao = sequelize.define('EvolucaoSessao', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  sessao_id: { type: DataTypes.INTEGER, allowNull: false },
  prontuario_id: { type: DataTypes.INTEGER, allowNull: false },
  psicologo_id: { type: DataTypes.INTEGER, allowNull: false },
  observacoes_clinicas: { type: DataTypes.TEXT, allowNull: false },
  status_preenchimento: { type: DataTypes.ENUM('completo','pendente','incompleto'), defaultValue: 'completo' }
}, { tableName: 'evolucoes_sessao' });

module.exports = EvolucaoSessao;
