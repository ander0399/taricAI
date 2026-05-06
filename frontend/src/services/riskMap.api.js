import api from './api';

/**
 * @description Retorna los perfiles mínimos de todos los países para colorear el mapa SVG.
 * Respuesta servida desde caché del backend (TTL configurable).
 * @returns {Promise<{ data: Array, lastGlobalUpdate: string, criticalCount: number, totalCountries: number }>}
 */
export const fetchAllCountries = () =>
  api.get('/risk-map/countries').then((r) => r.data);

/**
 * @description Retorna el perfil básico de un país sin proRecommendation (Plan Free).
 * @param {string} isoAlpha3 - Código ISO alpha-3
 * @returns {Promise<{ success: boolean, data: Object }>}
 */
export const fetchCountryBasic = (isoAlpha3) =>
  api.get(`/risk-map/country/${isoAlpha3}`).then((r) => r.data);

/**
 * @description Retorna el perfil completo con proRecommendation (Plan Pro+).
 * @param {string} isoAlpha3 - Código ISO alpha-3
 * @returns {Promise<{ success: boolean, data: Object }>}
 */
export const fetchCountryPro = (isoAlpha3) =>
  api.get(`/risk-map/country/${isoAlpha3}/pro`).then((r) => r.data);

/**
 * @description Retorna los países con riskLevel=critical o trend=deteriorating.
 * @returns {Promise<{ success: boolean, data: Array }>}
 */
export const fetchActiveAlerts = () =>
  api.get('/risk-map/alerts').then((r) => r.data);

/**
 * @description Retorna todos los países de una región geográfica.
 * @param {string} region - Africa|Americas|Asia|Europe|Oceania|MiddleEast
 * @returns {Promise<{ success: boolean, region: string, data: Array }>}
 */
export const fetchCountriesByRegion = (region) =>
  api.get(`/risk-map/region/${region}`).then((r) => r.data);

/**
 * @description Retorna el historial TRS de un país — últimos N días (Plan Pro+).
 * @param {string} isoAlpha3
 * @param {number} [days=30]
 * @returns {Promise<{ success: boolean, data: Array }>}
 */
export const fetchCountryHistory = (isoAlpha3, days = 30) =>
  api.get(`/risk-map/history/${isoAlpha3}`, { params: { days } }).then((r) => r.data);

/**
 * @description Descarga el análisis de riesgo de un país como PDF (Plan Pro+).
 * @param {string} isoAlpha3
 * @returns {Promise<Blob>}
 */
export const downloadRiskPDF = async (isoAlpha3) => {
  const response = await api.get(`/risk-map/export/${isoAlpha3}`, {
    responseType: 'blob',
  });
  const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `taricai-riesgo-${isoAlpha3}-${new Date().toISOString().slice(0, 10)}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * @description Registra una interacción del usuario con el mapa (fire-and-forget).
 * @param {string} isoAlpha3
 * @param {'click'|'filter'|'export'|'pin'} actionType
 * @returns {void} No retorna Promise — no usar await
 */
export const trackMapInteraction = (isoAlpha3, actionType) => {
  api.post('/risk-map/track', { isoAlpha3, actionType }).catch(() => {});
};
