const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Sala = sequelize.define('Sala', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nome: { type: DataTypes.STRING(100), allowNull: false },
  capacidade: { type: DataTypes.INTEGER, defaultValue: 2 },
  recursos: { type: DataTypes.TEXT, allowNull: true },
  tipo: { type: DataTypes.ENUM('presencial','online'), defaultValue: 'presencial' },
  ativa: { type: DataTypes.BOOLEAN, defaultValue: true }
}, { tableName: 'salas' });

module.exports = Sala;
