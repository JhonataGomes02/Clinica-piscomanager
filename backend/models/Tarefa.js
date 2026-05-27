const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Tarefa = sequelize.define('Tarefa', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  descricao: { type: DataTypes.TEXT, allowNull: false },
  paciente_id: { type: DataTypes.INTEGER, allowNull: true },
  responsavel_id: { type: DataTypes.INTEGER, allowNull: false },
  prazo: { type: DataTypes.DATEONLY, allowNull: true },
  status: { type: DataTypes.ENUM('pendente','concluida','atrasada'), defaultValue: 'pendente' }
}, { tableName: 'tarefas' });

module.exports = Tarefa;
