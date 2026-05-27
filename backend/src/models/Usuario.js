const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Usuario = sequelize.define('Usuario', {
  id:         { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nome:       { type: DataTypes.STRING(150), allowNull: false },
  email:      { type: DataTypes.STRING(200), allowNull: false, unique: true },
  senha_hash: { type: DataTypes.STRING(255), allowNull: false },
  perfil:     { type: DataTypes.ENUM('psicologo','administrador','paciente'), defaultValue: 'paciente' },
  crp:        { type: DataTypes.STRING(20), allowNull: true },
  ativo:      { type: DataTypes.BOOLEAN, defaultValue: true },
  criado_em:  { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { tableName: 'usuarios', timestamps: false });

module.exports = Usuario;
