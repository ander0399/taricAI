/**
 * @description Servicio de scraping inteligente de fuentes oficiales de comercio internacional.
 * Selecciona fuentes según queryType + países detectados en el mensaje.
 * Usa AbortController por fuente para tolerancia a fallos — nunca falla la consulta completa.
 */

const TIMEOUT_MS = parseInt(process.env.CHAT_SOURCE_TIMEOUT_MS, 10) || 8000;
const MAX_PARALLEL = parseInt(process.env.CHAT_MAX_PARALLEL_SOURCES, 10) || 6;

/**
 * @description Mapa global de fuentes oficiales indexadas por queryType.
 * Fuente de verdad para la selección inteligente de fuentes.
 */
const OFFICIAL_SOURCES_MAP = {
  tariff: [
    { url: 'https://tariffdata.wto.org', name: 'WTO Tariff Portal', country: 'Global', countryCode: 'WLD' },
    { url: 'https://www.macmap.org', name: 'ITC Market Access Map', country: 'Global', countryCode: 'WLD' },
    { url: 'https://hts.usitc.gov', name: 'USITC HTS Online', country: 'United States', countryCode: 'USA' },
    { url: 'https://www.wcoomd.org', name: 'WCO', country: 'Global', countryCode: 'WLD' },
    { url: 'https://www.globaltradealert.org', name: 'Global Trade Alert', country: 'Global', countryCode: 'WLD' },
  ],
  treaty: [
    { url: 'https://www.wto.org', name: 'WTO', country: 'Global', countryCode: 'WLD' },
    { url: 'https://www.aladi.org', name: 'ALADI', country: 'América Latina', countryCode: 'LAC' },
    { url: 'https://ustr.gov', name: 'USTR', country: 'United States', countryCode: 'USA' },
    { url: 'https://trade.ec.europa.eu', name: 'EU Trade', country: 'European Union', countryCode: 'EUU' },
  ],
  geopolitical: [
    { url: 'https://ofac.treasury.gov', name: 'OFAC (USA)', country: 'United States', countryCode: 'USA' },
    { url: 'https://www.sanctionsmap.eu', name: 'EU Sanctions Map', country: 'European Union', countryCode: 'EUU' },
    { url: 'https://www.globaltradealert.org', name: 'Global Trade Alert', country: 'Global', countryCode: 'WLD' },
    { url: 'https://www.wto.org/english/tratop_e/tpr_e/tpr_e.htm', name: 'WTO Trade Monitoring', country: 'Global', countryCode: 'WLD' },
    { url: 'https://unctad.org/tdr', name: 'UNCTAD TDR', country: 'Global', countryCode: 'WLD' },
  ],
  sanctions: [
    { url: 'https://ofac.treasury.gov', name: 'OFAC SDN List', country: 'United States', countryCode: 'USA' },
    { url: 'https://www.sanctionsmap.eu', name: 'EU Sanctions Map', country: 'European Union', countryCode: 'EUU' },
    { url: 'https://www.un.org/securitycouncil/sanctions', name: 'UN Security Council Sanctions', country: 'Global', countryCode: 'WLD' },
    { url: 'https://www.gov.uk/government/organisations/office-of-financial-sanctions-implementation', name: 'OFSI (UK)', country: 'United Kingdom', countryCode: 'GBR' },
    { url: 'https://www.fatf-gafi.org', name: 'FATF/GAFI', country: 'Global', countryCode: 'WLD' },
  ],
  market_research: [
    { url: 'https://www.trademap.org', name: 'ITC Trade Map', country: 'Global', countryCode: 'WLD' },
    { url: 'https://comtradeplus.un.org', name: 'UN Comtrade Plus', country: 'Global', countryCode: 'WLD' },
    { url: 'https://wits.worldbank.org', name: 'World Bank WITS', country: 'Global', countryCode: 'WLD' },
    { url: 'https://unctad.org', name: 'UNCTAD', country: 'Global', countryCode: 'WLD' },
    { url: 'https://www.census.gov/foreign-trade', name: 'US Census Foreign Trade', country: 'United States', countryCode: 'USA' },
  ],
  logistics: [
    { url: 'https://www.drewry.co.uk/supply-chain-advisors/supply-chain-expertise/world-container-index', name: 'Drewry WCI', country: 'Global', countryCode: 'WLD' },
    { url: 'https://www.balticexchange.com', name: 'Baltic Exchange', country: 'Global', countryCode: 'WLD' },
  ],
  regulatory: [
    { url: 'https://www.fda.gov', name: 'FDA', country: 'United States', countryCode: 'USA' },
    { url: 'https://www.bis.gov', name: 'BIS', country: 'United States', countryCode: 'USA' },
    { url: 'https://www.macmap.org', name: 'ITC Market Access Map', country: 'Global', countryCode: 'WLD' },
  ],
  customs_procedure: [
    { url: 'https://www.wcoomd.org', name: 'WCO', country: 'Global', countryCode: 'WLD' },
    { url: 'https://www.cbp.gov', name: 'CBP (USA)', country: 'United States', countryCode: 'USA' },
  ],
  valuation: [
    { url: 'https://www.wto.org', name: 'WTO Valuation', country: 'Global', countryCode: 'WLD' },
    { url: 'https://www.wcoomd.org', name: 'WCO', country: 'Global', countryCode: 'WLD' },
  ],
  legal: [
    { url: 'https://www.wto.org', name: 'WTO DSB', country: 'Global', countryCode: 'WLD' },
  ],
  general: [
    { url: 'https://www.wto.org', name: 'WTO', country: 'Global', countryCode: 'WLD' },
    { url: 'https://unctad.org', name: 'UNCTAD', country: 'Global', countryCode: 'WLD' },
    { url: 'https://www.trademap.org', name: 'ITC Trade Map', country: 'Global', countryCode: 'WLD' },
  ],
};

// Indicadores temporales que activan scraping (multi-idioma)
const TEMPORAL_INDICATORS = [
  'actual', 'vigente', 'hoy', 'reciente', 'nuevo', 'cuánto paga', 'cuánto cuesta', 'actualmente',
  'current', 'today', 'latest', 'now', 'updated', 'how much', 'rate today', 'current rate',
  'atual', 'hoje', 'vigente', 'recente',
  'actuel', "aujourd'hui", 'récent', 'combien',
  'الحالي', 'اليوم', 'الأخير',
  '现在', '最新', '当前', '今天',
];

// queryTypes que nunca activan scraping — conocimiento estable en el modelo
const NO_SCRAPE_TYPES = new Set(['incoterms', 'negotiation', 'contract', 'transport_law', 'transfer_pricing', 'out_of_scope']);

/**
 * @description Determina si la consulta requiere datos en tiempo real de fuentes oficiales.
 * @param {string} message - Mensaje del usuario
 * @param {string} queryType - Tipo clasificado por gpt-4o-mini
 * @returns {boolean}
 */
function needsRealTimeData(message, queryType) {
  if (NO_SCRAPE_TYPES.has(queryType)) return false;
  if (queryType === 'geopolitical' || queryType === 'sanctions') return true;
  const lowerMsg = message.toLowerCase();
  return TEMPORAL_INDICATORS.some(t => lowerMsg.includes(t));
}

/**
 * @description Selecciona las fuentes relevantes según queryType. Máximo MAX_PARALLEL.
 * @param {object} params
 * @param {string} params.queryType
 * @param {string[]} params.countries - ISO alpha-3 de países detectados en el mensaje
 * @returns {object[]} - Array de fuentes seleccionadas
 */
function selectSources({ queryType, countries }) {
  const sources = OFFICIAL_SOURCES_MAP[queryType] || OFFICIAL_SOURCES_MAP.general;
  return sources.slice(0, MAX_PARALLEL);
}

/**
 * @description Fetcha múltiples fuentes en paralelo con timeout individual por fuente.
 * Usa Promise.allSettled para tolerancia total a fallos — nunca lanza error.
 * @param {object[]} sources - Array de fuentes { url, name, country, countryCode }
 * @returns {Promise<object[]>} - Array con { ...source, content, status, fetchedAt }
 */
async function fetchSources(sources) {
  const results = await Promise.allSettled(
    sources.map(async (source) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
      try {
        const res = await fetch(source.url, {
          signal: controller.signal,
          headers: { 'User-Agent': 'TaricAI-Bot/1.0 (commercial intelligence platform)' },
        });
        clearTimeout(timer);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        // Extraer texto legible — eliminar tags HTML, scripts y styles
        const content = text
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 3000); // limitar para no sobrecargar el context window
        return { ...source, content, status: 'ok', fetchedAt: new Date().toISOString() };
      } catch (err) {
        clearTimeout(timer);
        const status = err.name === 'AbortError' ? 'timeout' : 'error';
        return { ...source, content: '', status, fetchedAt: new Date().toISOString() };
      }
    })
  );

  return results.map(r => r.status === 'fulfilled' ? r.value : { ...r.reason, status: 'error' });
}

/**
 * @description Construye el string de contexto de fuentes para inyectar en el system prompt.
 * Solo incluye fuentes con status 'ok' y content no vacío.
 * @param {object[]} fetchedSources - Resultado de fetchSources()
 * @returns {string} - Contexto formateado para el system prompt
 */
function extractContext(fetchedSources) {
  const okSources = fetchedSources.filter(s => s.status === 'ok' && s.content);
  if (!okSources.length) return '';
  return okSources
    .map(s => `[${s.name} — ${s.url}]\n${s.content}`)
    .join('\n\n---\n\n');
}

module.exports = {
  needsRealTimeData,
  selectSources,
  fetchSources,
  extractContext,
  OFFICIAL_SOURCES_MAP,
};
