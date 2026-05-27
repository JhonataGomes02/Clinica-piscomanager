const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Sessao = sequelize.define('Sessao', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  paciente_id: { type: DataTypes.INTEGER, allowNull: false },
  psicologo_id: { type: DataTypes.INTEGER, allowNull: false },
  sala_id: { type: DataTypes.INTEGER, allowNull: true },
  data_hora_inicio: { type: DataTypes.DATE, allowNull: false },
  data_hora_fim: { type: DataTypes.DATE, allowNull: true },
  modalidade: { type: DataTypes.ENUM('presencial','online','grupo'), defaultValue: 'presencial' },
  status: { type: DataTypes.ENUM('agendada','confirmada','cancelada','realizada'), defaultValue: 'agendada' },
  observacoes: { type: DataTypes.TEXT, allowNull: true },
  lembrete_enviado: { type: DataTypes.BOOLEAN, defaultValue: false }
}, { tableName: 'sessoes' });

module.exports = Sessao;
