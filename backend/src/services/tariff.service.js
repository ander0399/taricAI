const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { ClassificationSources } = require('../models');
const { officialSources, multilateralSources } = require('../utils/official.sources');

const TIMEOUT_MS = parseInt(process.env.PUPPETEER_TIMEOUT_MS) || 15000;
const MAX_PARALLEL = parseInt(process.env.MAX_PARALLEL_SOURCES) || 5;

/**
 * @description Consulta una fuente oficial y retorna un snippet del contenido accesible.
 *              Usa axios con timeout configurable. Para sitios que requieren JS (Puppeteer),
 *              esta función puede reemplazarse por un cliente headless en el futuro.
 *              Lanza un error con code 'TIMEOUT' o 'ERROR' para que Promise.allSettled lo capture.
 * @param {{ name: string, url: string, type: string }} source
 * @returns {Promise<{ sourceName: string, url: string, type: string, snippet: string }>}
 */
async function querySource(source) {
  try {
    const response = await axios.get(source.url, {
      timeout: TIMEOUT_MS,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TaricAI-Classifier/1.0; +https://taricai.com)' },
      maxRedirects: 3,
      // Aceptar cualquier 2xx/3xx — los errores de contenido los evalúa gpt-4o-mini
      validateStatus: (status) => status < 500,
      maxContentLength: 500 * 1024, // 500 KB max para no saturar el context de gpt-4o-mini
    });

    // Extraer texto plano eliminando HTML para reducir tokens en el prompt de consolidación
    const raw = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
    const text = raw
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 2000); // Máx. 2 000 chars por fuente → ~500 tokens para gpt-4o-mini

    return { sourceName: source.name, url: source.url, type: source.type, snippet: text };
  } catch (err) {
    const isTimeout = err.code === 'ECONNABORTED' || err.code === 'ERR_CANCELED' || err.message?.includes('timeout');
    throw Object.assign(new Error(isTimeout ? 'TIMEOUT' : 'ERROR'), {
      code: isTimeout ? 'TIMEOUT' : 'ERROR',
    });
  }
}

/**
 * @description Procesa fuentes en lotes para respetar MAX_PARALLEL_SOURCES.
 *              Cada lote ejecuta Promise.allSettled — los errores no interrumpen el flujo.
 * @param {Array} sources - Lista de fuentes a consultar
 * @returns {Promise<Array<PromiseSettledResult>>}
 */
async function querySourcesBatch(sources) {
  const results = [];
  for (let i = 0; i < sources.length; i += MAX_PARALLEL) {
    const batch = sources.slice(i, i + MAX_PARALLEL);
    const batchResults = await Promise.allSettled(batch.map(querySource));
    results.push(...batchResults);
  }
  return results;
}

/**
 * @description Orquesta la consulta paralela de fuentes arancelarias oficiales.
 *              Consulta fuentes del país exportador + importador + multilaterales.
 *              Registra cada resultado en ClassificationSources (ok/error/timeout).
 *              Retorna datos consolidados listos para pasar a callOpenAI('consolidate').
 *
 * @param {string} classificationId - UUID del registro en Classifications
 * @param {string} exporterCountry - ISO alpha-3 del país exportador
 * @param {string} importerCountry - ISO alpha-3 del país importador
 * @returns {Promise<{ tariffResults: Array, sourceCount: number }>}
 *   tariffResults: snippets de contenido exitosos para consolidación con gpt-4o-mini
 *   sourceCount:   total de fuentes consultadas (para logging y ClassificationSources)
 */
async function queryOfficialSources(classificationId, exporterCountry, importerCountry) {
  // Construir lista completa de fuentes etiquetadas con su país de origen
  const exporterList = (officialSources[exporterCountry]?.sources || [])
    .map((s) => ({ ...s, countryCode: exporterCountry, role: 'exporter' }));

  const importerList = (officialSources[importerCountry]?.sources || [])
    .map((s) => ({ ...s, countryCode: importerCountry, role: 'importer' }));

  const multilateralList = multilateralSources
    .map((s) => ({ ...s, countryCode: 'MUL', role: 'multilateral' }));

  const allSources = [...exporterList, ...importerList, ...multilateralList];

  if (allSources.length === 0) {
    return { tariffResults: [], sourceCount: 0 };
  }

  // Consultar todas las fuentes en lotes paralelos con Promise.allSettled
  const results = await querySourcesBatch(allSources);

  // Construir registros para ClassificationSources
  const now = new Date();
  const sourceRecords = results.map((result, i) => {
    let responseStatus = 'ok';
    if (result.status === 'rejected') {
      responseStatus = result.reason?.code === 'TIMEOUT' ? 'timeout' : 'error';
    }
    return {
      id: uuidv4(),
      classificationId,
      sourceUrl: allSources[i].url,
      sourceName: allSources[i].name,
      countryCode: allSources[i].countryCode,
      responseStatus,
      fetchedAt: now,
    };
  });

  // Guardar todos los resultados (ok + error + timeout) para trazabilidad
  await ClassificationSources.bulkCreate(sourceRecords, { validate: false });

  // Extraer solo los snippets exitosos para el prompt de consolidación
  const tariffResults = results
    .map((result, i) => ({
      result,
      meta: { role: allSources[i].role, country: allSources[i].countryCode, name: allSources[i].name },
    }))
    .filter(({ result }) => result.status === 'fulfilled')
    .map(({ result, meta }) => ({ ...result.value, ...meta }));

  return { tariffResults, sourceCount: allSources.length };
}

module.exports = { queryOfficialSources };
