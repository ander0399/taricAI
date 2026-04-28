const { Router } = require('express');
const { authenticate } = require('../middlewares/authMiddleware');
const { getCurrent, upgrade, downgrade, cancel, reactivate } = require('../controllers/subscription.controller');

const router = Router();

// Todos los endpoints requieren JWT válido
router.use(authenticate);

// GET  /api/subscription/current  — todos los roles
router.get('/current', getCurrent);

// POST /api/subscription/upgrade  — owner (verificado en service)
router.post('/upgrade', upgrade);

// POST /api/subscription/downgrade — owner (verificado en service)
router.post('/downgrade', downgrade);

// POST /api/subscription/cancel   — owner (verificado en service)
router.post('/cancel', cancel);

// POST /api/subscription/reactivate — owner (verificado en service)
router.post('/reactivate', reactivate);

module.exports = router;
