const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Convenio = sequelize.define('Convenio', {
  id:               { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nome:             { type: DataTypes.STRING(150), allowNull: false },
  percentual_pago:  { type: DataTypes.DECIMAL(5,2), allowNull: false }, // % que o convênio paga
  coparticipacao:   { type: DataTypes.DECIMAL(5,2), allowNull: false }, // % do paciente
  valor_referencia: { type: DataTypes.DECIMAL(10,2) },                  // valor base da sessão
  observacoes:      { type: DataTypes.TEXT },
  ativo:            { type: DataTypes.BOOLEAN, defaultValue: true },
  criado_em:        { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { tableName: 'convenios', timestamps: false });

module.exports = Convenio;
