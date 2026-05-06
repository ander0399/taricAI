const { Op } = require('sequelize');
const { CountryRiskProfiles, RiskUpdateLogs, UserMapInteractions, Classifications } = require('../models');

// ─── CACHÉ EN MEMORIA ─────────────────────────────────────────────────────────
// Por qué: el endpoint /countries se llama en cada render del mapa (hasta 139 países).
// Cachear evita 139 rows de DB en cada petición. TTL configurable via env.
const cache = { data: null, expiresAt: 0 };
const CACHE_TTL_MS = () => (parseInt(process.env.RISK_MAP_CACHE_TTL_SECONDS, 10) || 300) * 1000;

function invalidateCache() {
  cache.data = null;
  cache.expiresAt = 0;
}

// ─── CAMPOS MÍNIMOS PARA COLOREAR EL MAPA ────────────────────────────────────
const MAP_FIELDS = [
  'isoAlpha3', 'isoAlpha2', 'countryNameEs', 'region',
  'trsOverall', 'riskLevel', 'trend', 'lastUpdatedAt', 'updateStatus',
];

// ─── QUERIES PRINCIPALES ──────────────────────────────────────────────────────

/**
 * @description Retorna todos los perfiles con datos mínimos para colorear el mapa SVG.
 * Usa caché en memoria con TTL de RISK_MAP_CACHE_TTL_SECONDS para evitar DB overload.
 * Se invalida automáticamente cuando el cron actualiza un perfil.
 * @returns {Promise<{ data: Array, lastGlobalUpdate: string|null, criticalCount: number }>}
 * @throws {Error} Error de conexión a PostgreSQL
 */
async function getAllCountriesForMap() {
  const now = Date.now();
  if (cache.data && now < cache.expiresAt) {
    return cache.data;
  }

  const rows = await CountryRiskProfiles.findAll({
    attributes: [...MAP_FIELDS, 'updatedAt'],
    order: [['trsOverall', 'DESC']],
  });

  const lastGlobalUpdate = rows.length > 0
    ? rows.reduce((latest, r) => {
        const d = new Date(r.lastUpdatedAt);
        return d > latest ? d : latest;
      }, new Date(0)).toISOString()
    : null;

  const result = {
    data:             rows.map((r) => r.toJSON()),
    lastGlobalUpdate,
    criticalCount:    rows.filter((r) => r.riskLevel === 'critical').length,
    totalCountries:   rows.length,
  };

  cache.data = result;
  cache.expiresAt = now + CACHE_TTL_MS();

  return result;
}

/**
 * @description Retorna el perfil básico de un país SIN proRecommendation (Plan Free).
 * proRecommendation se fuerza a null aquí — gate server-side, no solo en middleware.
 * @param {string} isoAlpha3 - Código ISO alpha-3
 * @returns {Promise<Object>} Perfil sin proRecommendation
 * @throws {Error} code='COUNTRY_NOT_FOUND' si el ISO no existe en DB
 */
async function getCountryBasic(isoAlpha3) {
  const profile = await CountryRiskProfiles.findOne({
    where: { isoAlpha3: isoAlpha3.toUpperCase() },
    attributes: {
      exclude: ['proRecommendation'], // gate server-side — nunca en respuesta Free
    },
  });

  if (!profile) {
    throw Object.assign(
      new Error(`El código ISO alpha-3 '${isoAlpha3}' no existe.`),
      { code: 'COUNTRY_NOT_FOUND' }
    );
  }

  return profile.toJSON();
}

/**
 * @description Retorna el perfil completo de un país incluyendo proRecommendation (Plan Pro+).
 * @param {string} isoAlpha3 - Código ISO alpha-3
 * @returns {Promise<Object>} Perfil completo con todos los campos
 * @throws {Error} code='COUNTRY_NOT_FOUND' si el ISO no existe en DB
 */
async function getCountryPro(isoAlpha3) {
  const profile = await CountryRiskProfiles.findOne({
    where: { isoAlpha3: isoAlpha3.toUpperCase() },
  });

  if (!profile) {
    throw Object.assign(
      new Error(`El código ISO alpha-3 '${isoAlpha3}' no existe.`),
      { code: 'COUNTRY_NOT_FOUND' }
    );
  }

  return profile.toJSON();
}

/**
 * @description Retorna los países con riskLevel='critical' o trend='deteriorating',
 * ordenados por trsOverall descendente. Usado por GlobalAlertsBanner y el endpoint /alerts.
 * @param {number} [limit=10] - Máximo de resultados
 * @returns {Promise<Array>} Array de perfiles de alerta
 */
async function getActiveAlerts(limit = 10) {
  const rows = await CountryRiskProfiles.findAll({
    where: {
      [Op.or]: [
        { riskLevel: 'critical' },
        { trend: 'deteriorating' },
      ],
    },
    attributes: [...MAP_FIELDS, 'criticalInsight'],
    order: [['trsOverall', 'DESC']],
    limit,
  });

  return rows.map((r) => r.toJSON());
}

/**
 * @description Retorna todos los países de una región geográfica.
 * @param {string} region - Valor del ENUM: Africa|Americas|Asia|Europe|Oceania|MiddleEast
 * @returns {Promise<Array>} Array de perfiles mínimos filtrados por región
 */
async function getCountriesByRegion(region) {
  const rows = await CountryRiskProfiles.findAll({
    where: { region },
    attributes: MAP_FIELDS,
    order: [['trsOverall', 'DESC']],
  });

  return rows.map((r) => r.toJSON());
}

/**
 * @description Retorna el historial de cambios TRS de un país desde RiskUpdateLogs.
 * Solo registros con updateStatus completado (sin errores). Ordenados del más reciente al más antiguo.
 * @param {string} isoAlpha3 - Código ISO alpha-3
 * @param {number} [days=30] - Días hacia atrás a consultar
 * @returns {Promise<Array<{ createdAt, trsSnapshot, changesDetected, changesSummary }>>}
 * @throws {Error} code='COUNTRY_NOT_FOUND' si no existe el perfil
 */
async function getCountryHistory(isoAlpha3, days = 30) {
  const profileExists = await CountryRiskProfiles.count({
    where: { isoAlpha3: isoAlpha3.toUpperCase() },
  });
  if (!profileExists) {
    throw Object.assign(
      new Error(`El código ISO alpha-3 '${isoAlpha3}' no existe.`),
      { code: 'COUNTRY_NOT_FOUND' }
    );
  }

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const rows = await RiskUpdateLogs.findAll({
    where: {
      isoAlpha3: isoAlpha3.toUpperCase(),
      createdAt: { [Op.gte]: since },
      errorDetails: null, // solo actualizaciones exitosas
    },
    attributes: ['createdAt', 'trsSnapshot', 'previousTrs', 'changesDetected', 'changesSummary'],
    order: [['createdAt', 'DESC']],
    limit: 60, // máximo 2 meses de logs diarios
  });

  return rows.map((r) => r.toJSON());
}

/**
 * @description Registra una interacción intencional del usuario con el mapa.
 * Fire-and-forget seguro: los errores se logean pero no propagan al request del cliente.
 * Siempre incluye companyId para aislamiento multi-tenant en analytics.
 * @param {string} userId - ID del usuario autenticado
 * @param {string} companyId - ID de la empresa (aislamiento multi-tenant)
 * @param {string} isoAlpha3 - País con el que interactuó
 * @param {'click'|'filter'|'export'|'pin'} actionType
 * @returns {Promise<void>}
 */
async function trackUserInteraction(userId, companyId, isoAlpha3, actionType) {
  try {
    await UserMapInteractions.create({ userId, companyId, isoAlpha3, actionType });
  } catch (err) {
    // No propagar — un fallo de analytics no debe afectar la UX
    console.error('[riskMap.service] Error registrando interacción:', err.message);
  }
}

module.exports = {
  getAllCountriesForMap,
  getCountryBasic,
  getCountryPro,
  getActiveAlerts,
  getCountriesByRegion,
  getCountryHistory,
  trackUserInteraction,
  invalidateCache,
};
