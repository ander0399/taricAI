const { Router } = require('express');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const {
  createCheckoutSession,
  getPortalSession,
  getSubscriptionStatus,
} = require('../controllers/stripe.controller');

const router = Router();

// ⚠️ La ruta POST /webhook NO está aquí — se registra en server.js con express.raw()
// antes del middleware global express.json(). Ver server.js para la implementación.

/**
 * POST /api/stripe/create-checkout-session
 * Requiere JWT. Solo el owner puede iniciar un checkout de suscripción.
 */
router.post(
  '/create-checkout-session',
  authenticate,
  authorize('owner'),
  createCheckoutSession
);

/**
 * GET /api/stripe/portal-session
 * Requiere JWT. Redirige al Stripe Customer Portal para gestionar tarjeta y facturas.
 */
router.get(
  '/portal-session',
  authenticate,
  authorize('owner'),
  getPortalSession
);

/**
 * GET /api/stripe/subscription-status
 * Requiere JWT. Retorna el estado de la suscripción de la empresa del usuario autenticado.
 * Accesible para todos los roles (owner, admin, member) para mostrar el plan en el dashboard.
 */
router.get(
  '/subscription-status',
  authenticate,
  getSubscriptionStatus
);

module.exports = router;
