const { Router } = require('express');
const { authenticate } = require('../middlewares/authMiddleware');
const planLimiter = require('../middlewares/plan.limiter');
const requirePlan = require('../middlewares/require.plan');
const { upload, handleUploadError } = require('../middlewares/upload.middleware');
const { classifyTextHandler, classifyImageHandler, classifyOCRHandler, exportPDFHandler, getHistoryHandler, getHistoryDetailHandler, getCountriesHandler } = require('../controllers/classifier.controller');

const router = Router();

/**
 * Todas las rutas del clasificador requieren JWT válido + validación de límite de plan.
 * Orden obligatorio: authenticate → planLimiter → [requirePlan si aplica] → handler
 *
 * POST /api/classifier/text   — Clasificar por texto (todos los planes)
 * POST /api/classifier/image  — Clasificar por imagen [FASE 3]
 * POST /api/classifier/ocr    — Clasificar por documento OCR [FASE 7 — Pro+]
 * GET  /api/classifier/history           — Historial paginado [FASE 6]
 * GET  /api/classifier/history/:id       — Detalle de clasificación [FASE 6]
 * GET  /api/classifier/export/:id        — Exportar PDF [FASE 8 — Pro+]
 * GET  /api/classifier/countries         — Lista de 195 países con ISO-2/ISO-3 [FASE 4]
 */

router.post('/text', authenticate, planLimiter, classifyTextHandler);

// upload.single('image') procesa multipart en Etapa 1; en Etapa 2 el body es JSON puro
router.post('/image', authenticate, planLimiter, upload.single('image'), handleUploadError, classifyImageHandler);

// Solo Pro, Team y Enterprise — upload.single acepta PDF además de imágenes
router.post('/ocr', authenticate, planLimiter, requirePlan('pro', 'team', 'enterprise'), upload.single('image'), handleUploadError, classifyOCRHandler);

router.get('/history', authenticate, getHistoryHandler);
router.get('/history/:id', authenticate, getHistoryDetailHandler);

router.get('/export/:id', authenticate, planLimiter, requirePlan('pro', 'team', 'enterprise'), exportPDFHandler);

router.get('/countries', authenticate, getCountriesHandler);

module.exports = router;
