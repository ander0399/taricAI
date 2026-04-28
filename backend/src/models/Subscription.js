const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * @description Modelo Subscription — registra el estado de la suscripción activa de cada empresa.
 * Para el Plan Free, los campos Stripe quedan en null y stripeStatus es 'active'.
 * Para Plan Team, quantity refleja en todo momento los usuarios con activo=true.
 */
const Subscription = sequelize.define('Subscription', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  companyId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  plan: {
    type: DataTypes.ENUM('free', 'pro', 'team', 'enterprise'),
    allowNull: false,
  },
  stripeStatus: {
    type: DataTypes.ENUM('active', 'cancelled', 'past_due', 'trialing', 'incomplete'),
    allowNull: false,
    defaultValue: 'active',
  },
  stripePriceId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  // Solo relevante en Plan Team — refleja seats activos sincronizados con Stripe
  quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    allowNull: false,
  },
  currentPeriodStart: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  currentPeriodEnd: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  // true = la suscripción se cancela al final del período sin cobrar el siguiente ciclo
  cancelAtPeriodEnd: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  },
}, {
  tableName: 'subscriptions',
  timestamps: true,
});

module.exports = Subscription;
