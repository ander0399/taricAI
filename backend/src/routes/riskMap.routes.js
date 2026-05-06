const { Router } = require('express');
const { authenticate } = require('../middlewares/authMiddleware');
const readPlan = require('../middlewares/readPlan');
const requirePlan = require('../middlewares/require.plan');
const {
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
} = require('../controllers/riskMap.controller');

const router = Router();

/**
 * Mapa de Riesgo País — Rutas del módulo TARIC 360°
 *
 * Middleware chain:
 *   Free:       authenticate → handler
 *   Pro+:       authenticate → readPlan → requirePlan('pro','team','enterprise') → handler
 *   Enterprise: authenticate → readPlan → requirePlan('enterprise') → handler
 *
 * readPlan (no planLimiter) — el mapa no consume cuota de clasificaciones.
 */

// ── Rutas Free — solo JWT válido ─────────────────────────────────────────────
router.get('/countries',        authenticate, getAllCountriesHandler);
router.get('/country/:iso',     authenticate, getCountryBasicHandler);
router.get('/alerts',           authenticate, getAlertsHandler);
router.get('/region/:region',   authenticate, getByRegionHandler);
router.post('/track',           authenticate, trackInteractionHandler);

// ── Rutas Pro+ — JWT + plan mínimo Pro ───────────────────────────────────────
router.get(
  '/country/:iso/pro',
  authenticate, readPlan, requirePlan('pro', 'team', 'enterprise'),
  getCountryProHandler
);
router.get(
  '/history/:iso',
  authenticate, readPlan, requirePlan('pro', 'team', 'enterprise'),
  getCountryHistoryHandler
);
router.get(
  '/export/:iso',
  authenticate, readPlan, requirePlan('pro', 'team', 'enterprise'),
  exportCountryPDFHandler
);

// ── Rutas Enterprise — JWT + plan Enterprise ──────────────────────────────────
router.post(
  '/update/:iso',
  authenticate, readPlan, requirePlan('enterprise'),
  triggerManualUpdateHandler
);
router.post(
  '/cron/trigger',
  authenticate, readPlan, requirePlan('enterprise'),
  triggerCronBatchHandler
);

module.exports = router;
