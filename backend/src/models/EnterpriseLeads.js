const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * @description Modelo EnterpriseLeads — almacena los formularios de contacto Enterprise.
 * Cada lead es gestionado manualmente por el equipo de ventas desde el CRM interno.
 */
const EnterpriseLeads = sequelize.define('EnterpriseLeads', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(150),
    allowNull: false,
    validate: { notEmpty: true },
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    validate: { isEmail: true },
  },
  company: {
    type: DataTypes.STRING(150),
    allowNull: false,
    validate: { notEmpty: true },
  },
  country: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: { notEmpty: true },
  },
  usersCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 15 },
  },
  volume: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('new', 'contacted', 'closed'),
    defaultValue: 'new',
    allowNull: false,
  },
}, {
  tableName: 'enterprise_leads',
  timestamps: true,
});

module.exports = EnterpriseLeads;
