const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Pagamento = sequelize.define('Pagamento', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  sessao_id: { type: DataTypes.INTEGER, allowNull: true },
  paciente_id: { type: DataTypes.INTEGER, allowNull: false },
  descricao: { type: DataTypes.STRING(200), allowNull: true },
  valor: { type: DataTypes.DECIMAL(10,2), allowNull: false },
  tipo: { type: DataTypes.ENUM('receita','despesa'), defaultValue: 'receita' },
  forma_pagamento: { type: DataTypes.ENUM('pix','cartao_debito','cartao_credito','transferencia','dinheiro','convenio'), allowNull: true },
  status: { type: DataTypes.ENUM('pendente','pago','cancelado'), defaultValue: 'pendente' },
  data_pagamento: { type: DataTypes.DATEONLY, allowNull: true },
  categoria_despesa: { type: DataTypes.STRING(100), allowNull: true }
}, { tableName: 'pagamentos' });

module.exports = Pagamento;
