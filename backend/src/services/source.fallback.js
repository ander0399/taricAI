/**
 * @description Estrategia de fallback para fuentes arancelarias.
 *              Nivel 2: fuentes gubernamentales y bases de datos confiables.
 *              Nivel 3: fuentes comerciales secundarias (datos marcados como 'estimated').
 *              Se activa cuando las fuentes de Nivel 1 (oficiales por país) fallan o
 *              el país no tiene entrada en official.sources.js.
 */

const LEVEL2_SOURCES = [
  { name: 'Access2Markets (UE)',        url: 'https://trade.ec.europa.eu/access-to-markets/', type: 'market_access',    reliability: 'official'   },
  { name: 'Market Access Map (ITC)',    url: 'https://www.macmap.org/',                        type: 'tariff_ntb',       reliability: 'official'   },
  { name: 'WTO Tariff Analysis Online', url: 'https://tao.wto.org/',                          type: 'tariff_data',      reliability: 'official'   },
  { name: 'TRAINS (UNCTAD)',            url: 'https://trainsonline.unctad.org/',               type: 'ntb',              reliability: 'official'   },
  { name: 'WTO RTA Database',           url: 'https://rtais.wto.org/',                        type: 'agreements',       reliability: 'official'   },
];

const LEVEL3_SOURCES = [
  { name: 'SimplyDuty',    url: 'https://www.simplyduty.com/',   type: 'tariff_estimated', reliability: 'estimated' },
];

/**
 * @description Retorna fuentes de Nivel 2 etiquetadas para el rol dado.
 *              Se usa cuando el Nivel 1 falla completamente para un país.
 * @param {string} countryCode - ISO alpha-3 del país
 * @param {'exporter'|'importer'|'multilateral'} role
 * @returns {Array<{ name: string, url: string, type: string, reliability: string, countryCode: string, role: string, fallbackLevel: number }>}
 */
function getLevel2Sources(countryCode, role) {
  return LEVEL2_SOURCES.map((s) => ({
    ...s,
    countryCode,
    role,
    fallbackLevel: 2,
  }));
}

/**
 * @description Determina si se deben activar fuentes de fallback para un país.
 *              Retorna true si el país no tiene fuentes oficiales o si todas fallaron.
 * @param {Array<PromiseSettledResult>} results - Resultados de Promise.allSettled de las fuentes primarias
 * @returns {boolean}
 */
function shouldActivateFallback(results) {
  if (!results || results.length === 0) return true;
  const allFailed = results.every((r) => r.status === 'rejected');
  return allFailed;
}

module.exports = { getLevel2Sources, shouldActivateFallback, LEVEL2_SOURCES, LEVEL3_SOURCES };
