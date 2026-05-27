const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Evolucao = sequelize.define('Evolucao', {
  id:                   { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  sessao_id:            { type: DataTypes.INTEGER, allowNull: false },
  prontuario_id:        { type: DataTypes.INTEGER, allowNull: false },
  observacoes_clinicas: { type: DataTypes.TEXT, allowNull: false },
  status_preenchimento: { type: DataTypes.ENUM('completo','pendente','incompleto'), defaultValue: 'completo' },
  psicologo_id:         { type: DataTypes.INTEGER, allowNull: false },
  criado_em:            { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { tableName: 'evolucoes', timestamps: false });

module.exports = Evolucao;
