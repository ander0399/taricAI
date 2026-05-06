const { CountryRiskProfiles } = require('../models');
const { countries } = require('../utils/countries.data');

/**
 * @description Región de cada país por ISO alpha-3.
 * Clasificación basada en UN M.49 con ajuste comercial:
 * - Turquía, Israel y países del Cáucaso → MiddleEast / Asia (impacto logístico real)
 * - Egipto → Africa (clasificación UN estándar)
 * - Rusia → Europe (por integración en rutas comerciales europeas)
 */
const REGION_MAP = {
  // ── Africa ───────────────────────────────────────────────────────────────────
  AGO: 'Africa', DZA: 'Africa', CMR: 'Africa', CPV: 'Africa', CIV: 'Africa',
  COD: 'Africa', COG: 'Africa', EGY: 'Africa', ETH: 'Africa', GAB: 'Africa',
  GHA: 'Africa', KEN: 'Africa', LBY: 'Africa', MDG: 'Africa', MAR: 'Africa',
  MUS: 'Africa', MOZ: 'Africa', NGA: 'Africa', RWA: 'Africa', SEN: 'Africa',
  ZAF: 'Africa', SDN: 'Africa', TZA: 'Africa', TUN: 'Africa', UGA: 'Africa',
  ZMB: 'Africa', ZWE: 'Africa',

  // ── Americas ─────────────────────────────────────────────────────────────────
  ARG: 'Americas', BHS: 'Americas', BRB: 'Americas', BLZ: 'Americas',
  BOL: 'Americas', BRA: 'Americas', CAN: 'Americas', CHL: 'Americas',
  COL: 'Americas', CRI: 'Americas', CUB: 'Americas', DOM: 'Americas',
  ECU: 'Americas', SLV: 'Americas', GTM: 'Americas', GUY: 'Americas',
  HTI: 'Americas', HND: 'Americas', JAM: 'Americas', MEX: 'Americas',
  NIC: 'Americas', PAN: 'Americas', PRY: 'Americas', PER: 'Americas',
  SUR: 'Americas', TTO: 'Americas', USA: 'Americas', URY: 'Americas',
  VEN: 'Americas',

  // ── Asia ─────────────────────────────────────────────────────────────────────
  AFG: 'Asia', ARM: 'Asia', AZE: 'Asia', BGD: 'Asia', BRN: 'Asia',
  KHM: 'Asia', CHN: 'Asia', GEO: 'Asia', HKG: 'Asia', IND: 'Asia',
  IDN: 'Asia', JPN: 'Asia', KAZ: 'Asia', KOR: 'Asia', LAO: 'Asia',
  MAC: 'Asia', MYS: 'Asia', MDV: 'Asia', MNG: 'Asia', MMR: 'Asia',
  NPL: 'Asia', PAK: 'Asia', PHL: 'Asia', SGP: 'Asia', LKA: 'Asia',
  TWN: 'Asia', THA: 'Asia', TLS: 'Asia', TKM: 'Asia', UZB: 'Asia',
  VNM: 'Asia',

  // ── MiddleEast ───────────────────────────────────────────────────────────────
  BHR: 'MiddleEast', IRN: 'MiddleEast', IRQ: 'MiddleEast', ISR: 'MiddleEast',
  JOR: 'MiddleEast', KWT: 'MiddleEast', LBN: 'MiddleEast', OMN: 'MiddleEast',
  QAT: 'MiddleEast', SAU: 'MiddleEast', SYR: 'MiddleEast', ARE: 'MiddleEast',
  YEM: 'MiddleEast', TUR: 'MiddleEast',

  // ── Europe ───────────────────────────────────────────────────────────────────
  ALB: 'Europe', AUT: 'Europe', BLR: 'Europe', BEL: 'Europe', BIH: 'Europe',
  BGR: 'Europe', HRV: 'Europe', CZE: 'Europe', DNK: 'Europe', EST: 'Europe',
  FIN: 'Europe', FRA: 'Europe', DEU: 'Europe', GRC: 'Europe', HUN: 'Europe',
  ISL: 'Europe', IRL: 'Europe', ITA: 'Europe', XKX: 'Europe', LVA: 'Europe',
  LTU: 'Europe', LUX: 'Europe', MDA: 'Europe', MKD: 'Europe', MNE: 'Europe',
  NLD: 'Europe', NOR: 'Europe', POL: 'Europe', PRT: 'Europe', ROU: 'Europe',
  RUS: 'Europe', SRB: 'Europe', SVK: 'Europe', SVN: 'Europe', ESP: 'Europe',
  SWE: 'Europe', CHE: 'Europe', UKR: 'Europe', GBR: 'Europe',

  // ── Oceania ──────────────────────────────────────────────────────────────────
  AUS: 'Oceania', FJI: 'Oceania', NZL: 'Oceania', PNG: 'Oceania',
};

/**
 * @description Siembra los perfiles iniciales de riesgo para todos los países del sistema.
 * Los valores TRS se inicializan en 5.0 (neutral) con updateStatus='pending'.
 * El cron job de GPT-4o llenará criticalInsight, localSourceAlert y proRecommendation
 * en las primeras pasadas tras activar RISK_MAP_CRON_ENABLED=true.
 *
 * Idempotente: usa updateOnDuplicate sobre isoAlpha3 (unique constraint).
 * Solo actualiza campos TRS — no sobreescribe análisis narrativo ya generado por GPT.
 *
 * @param {import('sequelize').Transaction} [t] - Transacción opcional
 * @returns {Promise<void>}
 * @throws {Error} Si falla la conexión a PostgreSQL o la tabla no existe
 */
async function seedCountryRiskProfiles(t = null) {
  const now = new Date();

  const rows = countries.map((country) => ({
    isoAlpha3:      country.iso3,
    isoAlpha2:      country.iso2,
    countryName:    country.en,
    countryNameEs:  country.es,
    region:         REGION_MAP[country.iso3] || 'Asia', // fallback conservador
    trsOverall:     5.00,
    trsAduanero:    5.00,
    trsLogistico:   5.00,
    trsNormativo:   5.00,
    trsGeopolitico: 5.00,
    riskLevel:      'high',       // 5.0 cae en banda "Alto" (5.0–6.9)
    trend:          'stable',
    updateStatus:   'pending',    // el cron los procesa en la primera ejecución real
    lastUpdatedAt:  now,
    criticalInsight:    null,     // GPT-4o los llenará en la primera pasada del cron
    localSourceAlert:   null,
    proRecommendation:  null,
    sources:            [],
  }));

  const options = {
    // Solo actualiza campos TRS — no sobreescribe análisis narrativo real si ya existe
    updateOnDuplicate: [
      'trsOverall', 'trsAduanero', 'trsLogistico', 'trsNormativo', 'trsGeopolitico',
      'riskLevel', 'trend', 'updateStatus', 'updatedAt',
    ],
  };
  if (t) options.transaction = t;

  await CountryRiskProfiles.bulkCreate(rows, options);
  console.log(`  ✓ CountryRiskProfiles: ${rows.length} países sembrados con TRS inicial 5.0`);
}

module.exports = { seedCountryRiskProfiles };
