const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Prontuario = sequelize.define('Prontuario', {
  id:                   { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  paciente_id:          { type: DataTypes.INTEGER, allowNull: false, unique: true },
  queixa_principal:     { type: DataTypes.TEXT },
  historico_familiar:   { type: DataTypes.TEXT },
  historico_clinico:    { type: DataTypes.TEXT },
  medicamentos:         { type: DataTypes.TEXT },
  hipotese_diagnostica: { type: DataTypes.STRING(200) },
  criado_em:            { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  atualizado_em:        { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { tableName: 'prontuarios', timestamps: false });

module.exports = Prontuario;
