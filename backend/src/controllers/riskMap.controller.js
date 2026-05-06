const PDFDocument = require('pdfkit');
const {
  getAllCountriesForMap,
  getCountryBasic,
  getCountryPro,
  getActiveAlerts,
  getCountriesByRegion,
  getCountryHistory,
  trackUserInteraction,
} = require('../services/riskMap.service');
const { analyzeCountryRisk } = require('../services/riskMapAI.service');
const { processBatch, buildUpdateQueue } = require('../services/riskMapCron.service');

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const RISK_COLORS = {
  low:      '#22c55e',
  medium:   '#eab308',
  high:     '#f97316',
  critical: '#ef4444',
};

const RISK_LABELS = {
  low: 'Bajo', medium: 'Moderado', high: 'Alto', critical: 'Crítico',
};

const TREND_LABELS = {
  improving: '▼ Mejorando', stable: '→ Estable', deteriorating: '▲ Deteriorando',
};

// ─── HANDLERS ─────────────────────────────────────────────────────────────────

/**
 * @description GET /api/risk-map/countries
 * Retorna perfiles mínimos de todos los países para colorear el mapa SVG.
 * Respuesta servida desde caché en memoria (TTL configurable).
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const getAllCountriesHandler = async (req, res) => {
  try {
    const result = await getAllCountriesForMap();
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error('[riskMap] getAllCountriesHandler:', err.message);
    return res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
  }
};

/**
 * @description GET /api/risk-map/country/:iso
 * Retorna el perfil básico de un país sin proRecommendation (Plan Free).
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const getCountryBasicHandler = async (req, res) => {
  try {
    const data = await getCountryBasic(req.params.iso);
    return res.json({ success: true, data });
  } catch (err) {
    if (err.code === 'COUNTRY_NOT_FOUND') {
      return res.status(404).json({
        error: 'COUNTRY_NOT_FOUND',
        message: err.message,
        statusCode: 404,
      });
    }
    console.error('[riskMap] getCountryBasicHandler:', err.message);
    return res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
  }
};

/**
 * @description GET /api/risk-map/country/:iso/pro
 * Retorna el perfil completo con proRecommendation (Plan Pro+).
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const getCountryProHandler = async (req, res) => {
  try {
    const data = await getCountryPro(req.params.iso);
    return res.json({ success: true, data });
  } catch (err) {
    if (err.code === 'COUNTRY_NOT_FOUND') {
      return res.status(404).json({
        error: 'COUNTRY_NOT_FOUND',
        message: err.message,
        statusCode: 404,
      });
    }
    console.error('[riskMap] getCountryProHandler:', err.message);
    return res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
  }
};

/**
 * @description GET /api/risk-map/alerts
 * Retorna top 10 países con riskLevel=critical o trend=deteriorating.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const getAlertsHandler = async (req, res) => {
  try {
    const data = await getActiveAlerts(10);
    return res.json({ success: true, data });
  } catch (err) {
    console.error('[riskMap] getAlertsHandler:', err.message);
    return res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
  }
};

/**
 * @description GET /api/risk-map/region/:region
 * Retorna todos los países de una región geográfica.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const getByRegionHandler = async (req, res) => {
  const VALID_REGIONS = ['Africa', 'Americas', 'Asia', 'Europe', 'Oceania', 'MiddleEast'];
  const region = req.params.region;

  if (!VALID_REGIONS.includes(region)) {
    return res.status(400).json({
      error: 'INVALID_REGION',
      message: `Región inválida. Valores válidos: ${VALID_REGIONS.join(', ')}`,
    });
  }

  try {
    const data = await getCountriesByRegion(region);
    return res.json({ success: true, region, data });
  } catch (err) {
    console.error('[riskMap] getByRegionHandler:', err.message);
    return res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
  }
};

/**
 * @description GET /api/risk-map/history/:iso
 * Retorna el historial TRS de un país de los últimos 30 días (Plan Pro+).
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const getCountryHistoryHandler = async (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days, 10) || 30, 90);
    const data = await getCountryHistory(req.params.iso, days);
    return res.json({ success: true, isoAlpha3: req.params.iso.toUpperCase(), days, data });
  } catch (err) {
    if (err.code === 'COUNTRY_NOT_FOUND') {
      return res.status(404).json({ error: 'COUNTRY_NOT_FOUND', message: err.message });
    }
    console.error('[riskMap] getCountryHistoryHandler:', err.message);
    return res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
  }
};

/**
 * @description GET /api/risk-map/export/:iso
 * Genera y descarga un PDF con el análisis completo de riesgo del país (Plan Pro+).
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const exportCountryPDFHandler = async (req, res) => {
  try {
    const data = await getCountryPro(req.params.iso);

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const filename = `taricai-riesgo-${data.isoAlpha3}-${new Date().toISOString().slice(0, 10)}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    doc.pipe(res);

    const riskColor = RISK_COLORS[data.riskLevel] || '#6b7280';

    // ── Encabezado ──────────────────────────────────────────────────────────────
    doc.fontSize(20).fillColor('#1e3a5f').text('TARIC AI — Análisis de Riesgo País', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(13).fillColor('#374151')
      .text(`${data.countryNameEs} (${data.isoAlpha3})`, { align: 'center' });
    doc.moveDown(0.2);
    doc.fontSize(9).fillColor('#9ca3af')
      .text(`Generado: ${new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' })} · Datos al: ${new Date(data.lastUpdatedAt).toLocaleDateString('es-CO')}`, { align: 'center' });
    doc.moveDown(1);

    // ── Score TRS ───────────────────────────────────────────────────────────────
    doc.fontSize(14).fillColor('#111827').text('TARIC RISK SCORE (TRS)', { underline: true });
    doc.moveDown(0.3);
    doc.fontSize(36).fillColor(riskColor).text(String(data.trsOverall), { align: 'center' });
    doc.fontSize(11).fillColor('#6b7280').text(`${RISK_LABELS[data.riskLevel]} · ${TREND_LABELS[data.trend]}`, { align: 'center' });
    doc.moveDown(1);

    // ── Pilares ─────────────────────────────────────────────────────────────────
    doc.fontSize(12).fillColor('#111827').text('Desglose por Pilares', { underline: true });
    doc.moveDown(0.4);
    const pilares = [
      { label: 'Eficiencia Aduanera (30%)', value: data.trsAduanero },
      { label: 'Fluidez Logística (30%)',   value: data.trsLogistico },
      { label: 'Seguridad Normativa (20%)', value: data.trsNormativo },
      { label: 'Riesgo Geopolítico (20%)',  value: data.trsGeopolitico },
    ];
    for (const p of pilares) {
      const pColor = parseFloat(p.value) < 3 ? RISK_COLORS.low
        : parseFloat(p.value) < 5 ? RISK_COLORS.medium
        : parseFloat(p.value) < 7 ? RISK_COLORS.high
        : RISK_COLORS.critical;
      doc.fontSize(10).fillColor('#374151').text(`${p.label}: `, { continued: true });
      doc.fillColor(pColor).text(String(p.value));
    }
    doc.moveDown(1);

    // ── Análisis ─────────────────────────────────────────────────────────────────
    if (data.criticalInsight) {
      doc.fontSize(12).fillColor('#111827').text('Análisis Hoy', { underline: true });
      doc.moveDown(0.3);
      doc.fontSize(10).fillColor('#374151').text(data.criticalInsight);
      doc.moveDown(0.7);
    }

    if (data.localSourceAlert) {
      doc.fontSize(12).fillColor('#111827').text('Alerta Local', { underline: true });
      doc.moveDown(0.3);
      doc.fontSize(10).fillColor('#374151').text(data.localSourceAlert);
      doc.moveDown(0.7);
    }

    if (data.proRecommendation) {
      doc.fontSize(12).fillColor('#111827').text('Recomendación Táctica', { underline: true });
      doc.moveDown(0.3);
      doc.fontSize(10).fillColor('#059669').text(data.proRecommendation);
      doc.moveDown(0.7);
    }

    // ── Fuentes ──────────────────────────────────────────────────────────────────
    if (data.sources?.length) {
      doc.fontSize(10).fillColor('#9ca3af').text(`Fuentes: ${data.sources.join(' · ')}`);
      doc.moveDown(0.5);
    }

    doc.fontSize(8).fillColor('#d1d5db')
      .text('Este análisis es generado por inteligencia artificial y tiene carácter informativo. No constituye asesoría legal ni comercial.', { align: 'center' });

    doc.end();
  } catch (err) {
    if (err.code === 'COUNTRY_NOT_FOUND') {
      return res.status(404).json({ error: 'COUNTRY_NOT_FOUND', message: err.message });
    }
    console.error('[riskMap] exportCountryPDFHandler:', err.message);
    return res.status(500).json({ error: 'SERVER_ERROR', message: 'No se pudo generar el PDF.' });
  }
};

/**
 * @description POST /api/risk-map/update/:iso
 * Fuerza la actualización manual de un país con GPT-4o (Plan Enterprise).
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const triggerManualUpdateHandler = async (req, res) => {
  try {
    const result = await analyzeCountryRisk(req.params.iso.toUpperCase(), 'manual');
    return res.json({ success: result.success, ...result });
  } catch (err) {
    if (err.message?.includes('no encontrado')) {
      return res.status(404).json({ error: 'COUNTRY_NOT_FOUND', message: err.message });
    }
    console.error('[riskMap] triggerManualUpdateHandler:', err.message);
    return res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
  }
};

/**
 * @description POST /api/risk-map/cron/trigger
 * Dispara el batch de actualización completo manualmente (Plan Enterprise).
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const triggerCronBatchHandler = async (req, res) => {
  try {
    const queue = await buildUpdateQueue('all');
    // Ejecutar en background — responder inmediatamente con la cola
    processBatch(queue).catch((err) =>
      console.error('[riskMap] triggerCronBatchHandler background error:', err.message)
    );
    return res.json({
      success: true,
      message: `Batch iniciado en background. ${queue.length} países en cola.`,
      queue,
    });
  } catch (err) {
    console.error('[riskMap] triggerCronBatchHandler:', err.message);
    return res.status(500).json({ error: 'SERVER_ERROR', message: err.message });
  }
};

/**
 * @description POST /api/risk-map/track
 * Registra una interacción intencional del usuario con el mapa (analytics).
 * Fire-and-forget: responde 200 inmediatamente, el insert es asíncrono.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const trackInteractionHandler = async (req, res) => {
  const { isoAlpha3, actionType } = req.body;
  const VALID_ACTIONS = ['click', 'filter', 'export', 'pin'];

  if (!isoAlpha3 || !actionType || !VALID_ACTIONS.includes(actionType)) {
    return res.status(400).json({
      error: 'INVALID_INPUT',
      message: `actionType debe ser uno de: ${VALID_ACTIONS.join(', ')}`,
    });
  }

  const { userId, companyId } = req.user;

  // Fire-and-forget — no bloqueamos el response
  trackUserInteraction(userId, companyId, isoAlpha3.toUpperCase(), actionType);

  return res.json({ success: true });
};

module.exports = {
  getAllCountriesHandler,
  getCountryBasicHandler,
  getCountryProHandler,
  getAlertsHandler,
  getByRegionHandler,
  getCountryHistoryHandler,
  exportCountryPDFHandler,
  triggerManualUpdateHandler,
  triggerCronBatchHandler,
  trackInteractionHandler,
};
