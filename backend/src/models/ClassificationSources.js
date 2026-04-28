const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * @description Registro de fuentes oficiales consultadas en cada clasificación.
 * Una clasificación puede consultar múltiples fuentes (exportador, importador, multilaterales).
 * Si una fuente falla o hace timeout, el flujo continúa con las demás — el error queda aquí.
 */
const ClassificationSources = sequelize.define('ClassificationSources', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  classificationId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'classifications', key: 'id' },
    onDelete: 'CASCADE',
  },
  sourceUrl: {
    type: DataTypes.STRING(500),
    allowNull: false,
  },
  sourceName: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  /**
   * ISO alpha-3 del país al que pertenece la fuente.
   * 'MUL' para fuentes multilaterales (WCO, WTO, ITC, ALADI, UNCTAD).
   */
  countryCode: {
    type: DataTypes.STRING(3),
    allowNull: false,
  },
  responseStatus: {
    type: DataTypes.ENUM('ok', 'error', 'timeout'),
    allowNull: false,
    defaultValue: 'ok',
  },
  fetchedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'classification_sources',
  timestamps: false,
});

module.exports = ClassificationSources;
