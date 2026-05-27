const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Pagamento = sequelize.define('Pagamento', {
  id:              { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  sessao_id:       { type: DataTypes.INTEGER, allowNull: false },
  paciente_id:     { type: DataTypes.INTEGER, allowNull: false },
  valor:           { type: DataTypes.DECIMAL(10,2), allowNull: false },
  forma_pagamento: { type: DataTypes.ENUM('pix','cartao_debito','cartao_credito','transferencia','dinheiro','convenio'), allowNull: false },
  status:          { type: DataTypes.ENUM('pendente','pago','cancelado','estornado'), defaultValue: 'pendente' },
  data_pagamento:  { type: DataTypes.DATEONLY },
  observacoes:     { type: DataTypes.TEXT },
  criado_em:       { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { tableName: 'pagamentos', timestamps: false });

module.exports = Pagamento;
