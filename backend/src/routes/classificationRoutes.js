const { Router } = require('express');
const { createClassification, getClassifications, getUsageSummary } = require('../controllers/classificationController');
const { authenticate } = require('../middlewares/authMiddleware');
const tierGuard = require('../middlewares/tierGuard');

const router = Router();

/**
 * @description Rutas del módulo de clasificaciones arancelarias.
 *
 * POST /api/classifications         — Registrar clasificación (requiere JWT + tierGuard)
 * GET  /api/classifications         — Historial paginado (requiere JWT)
 * GET  /api/classifications/usage   — Resumen de consumo del mes (requiere JWT)
 */
router.post('/', authenticate, tierGuard, createClassification);
router.get('/usage', authenticate, getUsageSummary);
router.get('/', authenticate, getClassifications);

module.exports = router;
