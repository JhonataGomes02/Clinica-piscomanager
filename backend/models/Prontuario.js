const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Prontuario = sequelize.define('Prontuario', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  paciente_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  queixa_principal: { type: DataTypes.TEXT, allowNull: true },
  historico_familiar: { type: DataTypes.TEXT, allowNull: true },
  historico_clinico: { type: DataTypes.TEXT, allowNull: true },
  medicamentos: { type: DataTypes.TEXT, allowNull: true },
  hipotese_diagnostica: { type: DataTypes.STRING(200), allowNull: true },
  profissao: { type: DataTypes.STRING(100), allowNull: true },
  estado_civil: { type: DataTypes.STRING(50), allowNull: true }
}, { tableName: 'prontuarios' });

module.exports = Prontuario;
