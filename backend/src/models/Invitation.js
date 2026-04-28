const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * @description Modelo Invitation — sistema de registro cerrado por invitación.
 * El token es único y tiene expiración. Solo owner/admin con permiso puede crear invitaciones.
 */
const Invitation = sequelize.define('Invitation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: false,
    validate: { isEmail: true },
  },
  token: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  rolAsignado: {
    type: DataTypes.ENUM('admin', 'member'),
    allowNull: false,
    defaultValue: 'member',
  },
  companyId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  invitadoPorId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'expired'),
    defaultValue: 'pending',
    allowNull: false,
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
}, {
  tableName: 'invitations',
  timestamps: true,
});

module.exports = Invitation;
