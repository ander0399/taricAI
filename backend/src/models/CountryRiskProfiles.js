const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * @description Perfil maestro de riesgo logístico-aduanero por país.
 * Almacena el TARIC RISK SCORE (TRS) de 4 pilares actualizado diariamente por GPT-4o web_search.
 * Clave única: isoAlpha3 — exactamente un registro por país (195 en total).
 *
 * Invariante crítica: trsOverall y riskLevel SIEMPRE se calculan server-side con la fórmula
 * ponderada (30/30/20/20). Nunca se almacena el valor que devuelve GPT-4o para estos campos.
 */
const CountryRiskProfiles = sequelize.define('CountryRiskProfiles', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  isoAlpha3: {
    type: DataTypes.STRING(3),
    allowNull: false,
    unique: true,
  },
  isoAlpha2: {
    type: DataTypes.STRING(2),
    allowNull: false,
  },
  countryName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  countryNameEs: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  region: {
    type: DataTypes.ENUM('Africa', 'Americas', 'Asia', 'Europe', 'Oceania', 'MiddleEast'),
    allowNull: false,
  },
  subregion: {
    type: DataTypes.STRING,
    allowNull: true,
  },

  // ── TARIC RISK SCORE (TRS) — escala 1.0 (mínimo) a 10.0 (crítico) ──────────
  trsOverall: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: false,
  },
  trsAduanero: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: false,
    comment: 'Pilar 1 — Eficiencia aduanera y compliance (peso 30%)',
  },
  trsLogistico: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: false,
    comment: 'Pilar 2 — Fluidez logística (peso 30%)',
  },
  trsNormativo: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: false,
    comment: 'Pilar 3 — Seguridad jurídica y normativa (peso 20%)',
  },
  trsGeopolitico: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: false,
    comment: 'Pilar 4 — Riesgo geopolítico emergente (peso 20%)',
  },
  trend: {
    type: DataTypes.ENUM('improving', 'stable', 'deteriorating'),
    defaultValue: 'stable',
    allowNull: false,
  },
  riskLevel: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    allowNull: false,
    comment: 'Derivado de trsOverall server-side — nunca tomado de GPT-4o',
  },

  // ── Análisis narrativo — generado por GPT-4o, actualizado diariamente ────────
  criticalInsight: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  localSourceAlert: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  /**
   * Gate server-side: este campo NUNCA se expone en el endpoint /country/:iso (Free).
   * Solo se incluye en /country/:iso/pro (Plan Pro+).
   */
  proRecommendation: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  sources: {
    type: DataTypes.JSONB,
    defaultValue: [],
    allowNull: false,
  },

  // ── Metadata de actualización ─────────────────────────────────────────────────
  lastUpdatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  nextUpdateAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  updateStatus: {
    type: DataTypes.ENUM('pending', 'updating', 'completed', 'error'),
    defaultValue: 'pending',
    allowNull: false,
  },
}, {
  timestamps: true,
  indexes: [
    { fields: ['isoAlpha3'] },
    { fields: ['riskLevel'] },
    { fields: ['region'] },
    { fields: ['trsOverall'] },
    { fields: ['updateStatus'] },
  ],
});

module.exports = CountryRiskProfiles;
