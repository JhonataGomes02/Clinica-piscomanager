const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GoogleToken = sequelize.define('GoogleToken', {
  id:            { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  usuario_id:    { type: DataTypes.INTEGER, allowNull: false, unique: true },
  access_token:  { type: DataTypes.TEXT,    allowNull: false },
  refresh_token: { type: DataTypes.TEXT },
  expiry_date:   { type: DataTypes.BIGINT },
  criado_em:     { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  atualizado_em: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { tableName: 'google_tokens', timestamps: false });

module.exports = GoogleToken;
