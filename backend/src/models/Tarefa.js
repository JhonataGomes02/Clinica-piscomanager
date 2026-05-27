const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Tarefa = sequelize.define('Tarefa', {
  id:             { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  descricao:      { type: DataTypes.TEXT, allowNull: false },
  paciente_id:    { type: DataTypes.INTEGER },
  responsavel_id: { type: DataTypes.INTEGER, allowNull: false },
  prazo:          { type: DataTypes.DATEONLY },
  concluida:      { type: DataTypes.BOOLEAN, defaultValue: false },
  criado_em:      { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { tableName: 'tarefas', timestamps: false });

module.exports = Tarefa;
