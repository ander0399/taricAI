const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { ClassificationSources } = require('../models');
const { multilateralSources, getCountrySources } = require('../utils/official.sources');
const { getLevel2Sources, shouldActivateFallback } = require('./source.fallback');

const TIMEOUT_MS    = parseInt(process.env.PUPPETEER_TIMEOUT_MS) || 15000;
const MAX_PARALLEL  = parseInt(process.env.MAX_PARALLEL_SOURCES)  || 5;
const RETRY_COUNT   = parseInt(process.env.SOURCE_RETRY_COUNT)    || 1;
const FALLBACK_ON   = process.env.SOURCE_FALLBACK_ENABLED !== 'false';

/**
 * @description Consulta una fuente oficial y retorna un snippet del contenido accesible.
 *              Usa axios con timeout configurable. Lanza un error con code 'TIMEOUT' o 'ERROR'.
 * @param {{ name: string, url: string, type: string }} source
 * @returns {Promise<{ sourceName: string, url: string, type: string, snippet: string, reliability: string }>}
 * @throws {Error} Con code 'TIMEOUT' o 'ERROR' para que Promise.allSettled lo capture
 */
async function querySource(source) {
  const reliability = source.reliability || 'official';
  try {
    const response = await axios.get(source.url, {
      timeout: TIMEOUT_MS,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TaricAI-Classifier/1.0; +https://taricai.com)' },
      maxRedirects: 3,
      validateStatus: (status) => status < 500,
      maxContentLength: 500 * 1024,
    });

    const raw = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
    const text = raw
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 2000);

    return { sourceName: source.name, url: source.url, type: source.type, snippet: text, reliability };
  } catch (err) {
    const isTimeout = err.code === 'ECONNABORTED' || err.code === 'ERR_CANCELED' || err.message?.includes('timeout');
    throw Object.assign(new Error(isTimeout ? 'TIMEOUT' : 'ERROR'), {
      code: isTimeout ? 'TIMEOUT' : 'ERROR',
    });
  }
}

/**
 * @description Consulta una fuente con retry automático ante fallo.
 * @param {{ name: string, url: string, type: string }} source
 * @param {number} retries - Número de reintentos permitidos
 * @returns {Promise<object>}
 */
async function querySourceWithRetry(source, retries = RETRY_COUNT) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await querySource(source);
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}

/**
 * @description Ejecuta consultas en paralelo respetando MAX_PARALLEL mediante semáforo manual.
 *              Equivalente a pLimit(MAX_PARALLEL) sin dependencia externa.
 * @param {Array} sources
 * @returns {Promise<Array<PromiseSettledResult>>}
 */
async function querySourcesBatch(sources) {
  const results = [];
  for (let i = 0; i < sources.length; i += MAX_PARALLEL) {
    const batch = sources.slice(i, i + MAX_PARALLEL);
    const batchResults = await Promise.allSettled(
      batch.map((s) => querySourceWithRetry(s))
    );
    results.push(...batchResults);
  }
  return results;
}

/**
 * @description Orquesta la consulta paralela de fuentes arancelarias con estrategia de 3 niveles.
 *
 *  Nivel 1: Fuentes oficiales por país (official.sources.js)
 *  Nivel 2: Fallback a Access2Markets, MacMap, WTO si Nivel 1 falla completamente
 *  Nivel 3: Solo si Nivel 2 también falla (marcado como 'estimated')
 *
 *  Siempre consulta fuentes multilaterales (WCO, WTO, ITC, ALADI, UNCTAD).
 *  Registra cada resultado en ClassificationSources (ok/error/timeout).
 *
 * @param {string} classificationId - UUID del registro en Classifications
 * @param {string} exporterCountry - ISO alpha-3 del país exportador
 * @param {string} importerCountry - ISO alpha-3 del país importador
 * @returns {Promise<{ tariffResults: Array, sourceCount: number, allSourcesFailed: boolean }>}
 *   tariffResults: snippets exitosos para el prompt de consolidación
 *   sourceCount:   total de fuentes consultadas
 *   allSourcesFailed: true si TODAS las fuentes fallaron (advertencia en respuesta)
 */
async function queryOfficialSources(classificationId, exporterCountry, importerCountry) {
  // ── Nivel 1: fuentes oficiales por país ───────────────────────────────────
  const exporterPrimary = getCountrySources(exporterCountry)
    .map((s) => ({ ...s, countryCode: exporterCountry, role: 'exporter' }));
  const importerPrimary = getCountrySources(importerCountry)
    .map((s) => ({ ...s, countryCode: importerCountry, role: 'importer' }));
  const multilateral = multilateralSources
    .map((s) => ({ ...s, role: 'multilateral' }));

  let allSources = [...exporterPrimary, ...importerPrimary, ...multilateral];

  // Si un país no tiene fuentes propias → activar Nivel 2 de inmediato para ese país
  if (exporterPrimary.length === 0) {
    allSources = [...getLevel2Sources(exporterCountry, 'exporter'), ...allSources];
  }
  if (importerPrimary.length === 0) {
    allSources = [...allSources, ...getLevel2Sources(importerCountry, 'importer')];
  }

  if (allSources.length === 0) {
    return { tariffResults: [], sourceCount: 0, allSourcesFailed: true };
  }

  // Consultar Nivel 1 + multilaterales
  const results = await querySourcesBatch(allSources);

  // ── Nivel 2: fallback si TODAS las fuentes de un país fallaron ────────────
  let extraSources = [];
  let extraResults = [];

  if (FALLBACK_ON) {
    const exporterResults = results.slice(0, exporterPrimary.length);
    const importerResults = results.slice(exporterPrimary.length, exporterPrimary.length + importerPrimary.length);

    if (shouldActivateFallback(exporterResults) && exporterPrimary.length > 0) {
      extraSources.push(...getLevel2Sources(exporterCountry, 'exporter'));
    }
    if (shouldActivateFallback(importerResults) && importerPrimary.length > 0) {
      extraSources.push(...getLevel2Sources(importerCountry, 'importer'));
    }

    if (extraSources.length > 0) {
      extraResults = await querySourcesBatch(extraSources);
    }
  }

  const combinedSources  = [...allSources, ...extraSources];
  const combinedResults  = [...results, ...extraResults];

  // ── Registrar todos los resultados en ClassificationSources ───────────────
  const now = new Date();
  const sourceRecords = combinedResults.map((result, i) => {
    let responseStatus = 'ok';
    if (result.status === 'rejected') {
      responseStatus = result.reason?.code === 'TIMEOUT' ? 'timeout' : 'error';
    }
    return {
      id: uuidv4(),
      classificationId,
      sourceUrl:      combinedSources[i].url,
      sourceName:     combinedSources[i].name,
      countryCode:    combinedSources[i].countryCode || 'MUL',
      responseStatus,
      fetchedAt:      now,
    };
  });

  await ClassificationSources.bulkCreate(sourceRecords, { validate: false });

  // ── Extraer snippets exitosos para consolidación ───────────────────────────
  const tariffResults = combinedResults
    .map((result, i) => ({
      result,
      meta: {
        role:        combinedSources[i].role,
        country:     combinedSources[i].countryCode || 'MUL',
        name:        combinedSources[i].name,
        type:        combinedSources[i].type,
        reliability: combinedSources[i].reliability || 'official',
        fallback:    combinedSources[i].fallbackLevel || 1,
      },
    }))
    .filter(({ result }) => result.status === 'fulfilled')
    .map(({ result, meta }) => ({ ...result.value, ...meta }));

  const allSourcesFailed = combinedResults.every((r) => r.status === 'rejected');

  return { tariffResults, sourceCount: combinedSources.length, allSourcesFailed };
}

module.exports = { queryOfficialSources };
