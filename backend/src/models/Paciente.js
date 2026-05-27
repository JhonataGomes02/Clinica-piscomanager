const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Paciente = sequelize.define('Paciente', {
  id:                 { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  usuario_id:         { type: DataTypes.INTEGER, allowNull: false },
  cpf:                { type: DataTypes.STRING(14) },
  data_nascimento:    { type: DataTypes.DATEONLY },
  telefone:           { type: DataTypes.STRING(20) },
  endereco:           { type: DataTypes.TEXT },
  contato_emergencia: { type: DataTypes.STRING(200) },
  profissao:          { type: DataTypes.STRING(100) },
  psicologo_id:       { type: DataTypes.INTEGER },
  plano:              { type: DataTypes.ENUM('particular_mensal','pacote_5','pacote_10','convenio'), defaultValue: 'particular_mensal' },
  saldo_sessoes:      { type: DataTypes.INTEGER },
  criado_em:          { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { tableName: 'pacientes', timestamps: false });

module.exports = Paciente;
