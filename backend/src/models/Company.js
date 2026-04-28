const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * @description Modelo Company — raíz del tenant. Cada empresa tiene su propio
 * espacio de datos aislado. El propietarioId es inmutable tras la creación.
 */
const Company = sequelize.define('Company', {
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
  plan: {
    type: DataTypes.ENUM('free', 'pro', 'team', 'enterprise'),
    defaultValue: 'free',
    allowNull: false,
  },
  propietarioId: {
    type: DataTypes.UUID,
    allowNull: true, // Se asigna tras crear el owner
  },
  // ID del Customer en Stripe: cus_xxx — null hasta que el owner inicia un checkout de pago
  stripeCustomerId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
  },
  // ID de la suscripción activa en Stripe: sub_xxx — null en Plan Free
  stripeSubscriptionId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
  },
}, {
  tableName: 'companies',
  timestamps: true,
});

module.exports = Company;
