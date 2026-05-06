const cron = require('node-cron');
const { Op } = require('sequelize');
const { CountryRiskProfiles, UserMapInteractions, Classifications } = require('../models');
const { analyzeCountryRisk } = require('./riskMapAI.service');
const { invalidateCache } = require('./riskMap.service');

// ─── GUARD DE SOLAPAMIENTO ────────────────────────────────────────────────────
// Por qué: si una pasada tarda más de lo esperado (GPT lento, rate limits),
// el siguiente cron se dispararía solapando al anterior. El flag lo previene.
let cronRunning = false;

// ─── UTILIDAD ─────────────────────────────────────────────────────────────────

/**
 * @description Pausa la ejecución N milisegundos.
 * @param {number} ms - Milisegundos a esperar
 * @returns {Promise<void>}
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ─── COLA DE PRIORIDAD ────────────────────────────────────────────────────────

/**
 * @description Construye la cola de países ordenada por prioridad para una pasada del cron.
 * Prioridad 1 — CRÍTICA (siempre): riskLevel=critical + updateStatus=error + trend=deteriorating
 * Prioridad 2 — ALTA: países consultados en últimas 24h (mapa o clasificaciones recientes)
 * Prioridad 3 — NORMAL: rotación equitativa por lastUpdatedAt ASC (el más antiguo primero)
 *
 * Por qué 3 niveles: garantiza que los países con mayor urgencia operativa se actualizan
 * en cada ciclo, mientras la rotación equitativa asegura cobertura total en ~4-5 días.
 * @param {'high'|'medium'|'all'} priorityLevel - Qué niveles incluir en esta pasada
 * @returns {Promise<Array<string>>} Array de isoAlpha3 en orden de prioridad descendente
 */
async function buildUpdateQueue(priorityLevel) {
  const batchSize = parseInt(process.env.RISK_MAP_BATCH_SIZE, 10) || 15;
  const queue = [];
  const added = new Set();

  // ── Prioridad 1: críticos + errores + deteriorando ──────────────────────────
  const priority1 = await CountryRiskProfiles.findAll({
    where: {
      [Op.or]: [
        { riskLevel: 'critical' },
        { updateStatus: 'error' },
        { trend: 'deteriorating' },
      ],
    },
    attributes: ['isoAlpha3'],
    order: [['trsOverall', 'DESC']],
  });

  for (const row of priority1) {
    if (!added.has(row.isoAlpha3)) {
      queue.push(row.isoAlpha3);
      added.add(row.isoAlpha3);
    }
  }

  // ── Prioridad 2: países con interacciones en últimas 24h ────────────────────
  if (['high', 'all'].includes(priorityLevel)) {
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Países con clicks/filtros recientes en el mapa
    const recentMapInteractions = await UserMapInteractions.findAll({
      where: { createdAt: { [Op.gte]: since24h } },
      attributes: ['isoAlpha3'],
      group: ['isoAlpha3'],
    });

    for (const row of recentMapInteractions) {
      if (!added.has(row.isoAlpha3)) {
        queue.push(row.isoAlpha3);
        added.add(row.isoAlpha3);
      }
    }

    // Países involucrados en clasificaciones recientes
    const recentClassifications = await Classifications.findAll({
      where: { createdAt: { [Op.gte]: since24h } },
      attributes: ['originCountry', 'destCountry'],
    });

    for (const row of recentClassifications) {
      for (const iso of [row.originCountry, row.destCountry]) {
        if (iso && !added.has(iso)) {
          queue.push(iso);
          added.add(iso);
        }
      }
    }
  }

  // ── Prioridad 3: rotación equitativa — el más antiguo primero ───────────────
  if (queue.length < batchSize) {
    const remaining = batchSize - queue.length;
    const rotational = await CountryRiskProfiles.findAll({
      where: {
        isoAlpha3: { [Op.notIn]: [...added] },
        updateStatus: { [Op.not]: 'updating' }, // no interrumpir actualizaciones en curso
      },
      attributes: ['isoAlpha3'],
      order: [['lastUpdatedAt', 'ASC']], // el más desactualizado primero
      limit: remaining,
    });

    for (const row of rotational) {
      queue.push(row.isoAlpha3);
    }
  }

  return queue.slice(0, batchSize);
}

// ─── PROCESAMIENTO DE BATCH ───────────────────────────────────────────────────

/**
 * @description Procesa un batch de países secuencialmente con delay entre cada uno.
 * Secuencial (no paralelo) por dos razones: respetar rate limits de OpenAI y garantizar
 * que cada análisis de web_search sea completo antes de pasar al siguiente país.
 * Un error en un país no detiene el batch — se registra y continúa con el siguiente.
 * @param {Array<string>} isoCodes - Códigos ISO alpha-3 a procesar
 * @param {number} [delayMs] - Milisegundos de espera entre países (default: env var)
 * @returns {Promise<{ processed: number, updated: number, errors: number, errorDetails: Array }>}
 */
async function processBatch(isoCodes, delayMs) {
  const delay = delayMs ?? (parseInt(process.env.RISK_MAP_BATCH_DELAY_MS, 10) || 2000);
  const stats = { processed: 0, updated: 0, errors: 0, errorDetails: [] };

  for (const iso of isoCodes) {
    const result = await analyzeCountryRisk(iso, 'cron');
    stats.processed++;

    if (result.success) {
      stats.updated++;
      // Invalidar caché después de cada actualización exitosa para mantener datos frescos
      invalidateCache();
    } else {
      stats.errors++;
      stats.errorDetails.push({ isoAlpha3: iso, error: result.error });
    }

    // Delay entre países — excepto tras el último
    if (iso !== isoCodes[isoCodes.length - 1]) {
      await sleep(delay);
    }
  }

  return stats;
}

// ─── RUNNER DE PASADA ─────────────────────────────────────────────────────────

/**
 * @description Ejecuta una pasada completa del cron: construye cola → procesa batch → reporta.
 * @param {string} passName - Nombre de la pasada para logging ('alta-prioridad' | 'apertura-americas' | 'verificacion-criticos')
 * @param {'high'|'medium'|'all'} priorityLevel
 * @returns {Promise<void>}
 */
async function runPass(passName, priorityLevel) {
  if (cronRunning) {
    console.warn(`[riskMapCron] Pasada '${passName}' omitida — cron ya en ejecución.`);
    return;
  }

  cronRunning = true;
  const t0 = Date.now();
  console.log(`[riskMapCron] ▶ Iniciando pasada '${passName}' (prioridad: ${priorityLevel})...`);

  try {
    const queue = await buildUpdateQueue(priorityLevel);
    console.log(`[riskMapCron] Cola de actualización: ${queue.length} países — ${queue.join(', ')}`);

    if (queue.length === 0) {
      console.log('[riskMapCron] Cola vacía — nada que actualizar en esta pasada.');
      return;
    }

    const stats = await processBatch(queue);
    const elapsedSec = ((Date.now() - t0) / 1000).toFixed(1);

    console.log(
      `[riskMapCron] ✓ Pasada '${passName}' completada en ${elapsedSec}s — ` +
      `procesados: ${stats.processed}, actualizados: ${stats.updated}, errores: ${stats.errors}`
    );

    if (stats.errors > 0) {
      console.warn('[riskMapCron] Países con error:', stats.errorDetails.map((e) => e.isoAlpha3).join(', '));
    }
  } catch (err) {
    console.error(`[riskMapCron] Error fatal en pasada '${passName}':`, err.message);
  } finally {
    cronRunning = false;
  }
}

// ─── INICIALIZACIÓN ───────────────────────────────────────────────────────────

/**
 * @description Inicializa los 3 cron jobs de actualización diaria.
 * Por qué 3 pasadas: cubrir distintas franjas de noticias globales.
 *   05:00 UTC → noticias de la noche asiática y apertura europea
 *   11:00 UTC → apertura de mercados americanos
 *   17:00 UTC → refresca críticos al cierre europeo
 *
 * El flag cronRunning evita solapamiento entre pasadas en caso de ejecución lenta.
 * Solo se inicializa si RISK_MAP_CRON_ENABLED=true — false en desarrollo local.
 * @returns {void}
 */
function initRiskMapCron() {
  // Pasada 1 — 05:00 UTC: alta prioridad (críticos + deteriorando + consultados)
  cron.schedule('0 5 * * *', () => runPass('alta-prioridad', 'all'), { timezone: 'UTC' });

  // Pasada 2 — 11:00 UTC: apertura de mercados americanos
  cron.schedule('0 11 * * *', () => runPass('apertura-americas', 'high'), { timezone: 'UTC' });

  // Pasada 3 — 17:00 UTC: verificación de críticos al cierre europeo
  cron.schedule('0 17 * * *', () => runPass('verificacion-criticos', 'high'), { timezone: 'UTC' });

  console.log('[riskMapCron] 3 pasadas diarias registradas: 05:00, 11:00, 17:00 UTC');
}

module.exports = {
  initRiskMapCron,
  buildUpdateQueue,
  processBatch,
  sleep,
};
