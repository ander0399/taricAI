const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * @description Modelo Team — agrupación de usuarios dentro de una empresa.
 * Siempre pertenece a una Company (tenant isolation garantizado por companyId).
 */
const Team = sequelize.define('Team', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  nombre: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: { notEmpty: true },
  },
  companyId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
}, {
  tableName: 'teams',
  timestamps: true,
});

module.exports = Team;
