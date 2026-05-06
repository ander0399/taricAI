const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * @description Historial de actualizaciones diarias del TARIC RISK SCORE por país.
 * Registro inmutable de auditoría — solo tiene createdAt, nunca updatedAt.
 * No tiene FK formal a CountryRiskProfiles para evitar JOINs costosos en consultas de logs.
 * Si el update falla, errorDetails documenta el motivo y el país queda en cola prioritaria.
 */
const RiskUpdateLogs = sequelize.define('RiskUpdateLogs', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  isoAlpha3: {
    type: DataTypes.STRING(3),
    allowNull: false,
  },
  // Snapshot completo del perfil TRS en el momento de esta actualización
  trsSnapshot: {
    type: DataTypes.JSONB,
    allowNull: false,
  },
  // trsOverall antes de esta actualización — permite calcular el delta de cambio
  previousTrs: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: true,
  },
  changesDetected: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  },
  changesSummary: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  triggeredBy: {
    type: DataTypes.ENUM('cron', 'manual', 'test'),
    defaultValue: 'cron',
    allowNull: false,
  },
  aiModel: {
    type: DataTypes.STRING,
    defaultValue: 'gpt-4o',
    allowNull: false,
  },
  tokensUsed: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  processingMs: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  // Solo poblado cuando el update falló — detalle del error para diagnóstico
  errorDetails: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  timestamps: true,
  updatedAt: false, // log inmutable — los registros de auditoría no se modifican
  indexes: [
    { fields: ['isoAlpha3', 'createdAt'] },
  ],
});

module.exports = RiskUpdateLogs;
