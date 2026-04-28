const Stripe = require('stripe');
const stripeService = require('../services/stripe.service');

// Instancia compartida para la validación de firma del webhook
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * @description Crea una Stripe Checkout Session para Plan Pro o Team.
 *              El usuario autenticado debe ser owner de la empresa.
 *              Retorna { url } para redirigir al frontend al hosted checkout.
 * @param {import('express').Request} req - req.user inyectado por middleware authenticate
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>} JSON { url: string }
 */
const createCheckoutSession = async (req, res, next) => {
  try {
    const { planId } = req.body;
    const { companyId, userId } = req.user;

    const url = await stripeService.createCheckoutSession(companyId, userId, planId);

    res.status(200).json({ url });
  } catch (err) {
    next(err);
  }
};

/**
 * @description Recibe y valida eventos del webhook de Stripe.
 *              Usa express.raw() — el body llega como Buffer sin parsear.
 *              Siempre responde 200 para confirmar recepción: Stripe reintenta si no recibe 2xx.
 *              La lógica de negocio de cada evento se delega al webhook handler (Fase 3).
 * @param {import('express').Request} req - Body tipo Buffer (NO JSON parseado)
 * @param {import('express').Response} res
 * @returns {void}
 */
const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    // constructEvent valida que el body no fue alterado comparando con la firma HMAC
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    // Firma inválida — posible request malicioso o secret incorrecto
    console.error('[Webhook] Firma inválida:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  // Delegar al handler de eventos — implementado en Fase 3
  try {
    const { handleStripeEvent } = require('../webhooks/stripe.webhook.handler');
    await handleStripeEvent(event);
  } catch (err) {
    // Loggeamos el error pero devolvemos 200 igualmente para evitar reintentos infinitos de Stripe
    console.error(`[Webhook] Error procesando evento ${event.type}:`, err.message);
  }

  // Stripe requiere 200 para confirmar que el evento fue recibido
  res.status(200).json({ received: true });
};

/**
 * @description Crea una sesión del Stripe Customer Portal para gestión de tarjeta,
 *              facturas y cancelación. Solo accesible con suscripción de pago activa.
 * @param {import('express').Request} req - req.user inyectado por middleware authenticate
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>} JSON { url: string }
 */
const getPortalSession = async (req, res, next) => {
  try {
    const { companyId } = req.user;
    const url = await stripeService.createPortalSession(companyId);
    res.status(200).json({ url });
  } catch (err) {
    next(err);
  }
};

/**
 * @description Retorna el estado actual de la suscripción de la empresa autenticada.
 *              Útil para que el frontend muestre el plan activo, fecha de renovación y seats.
 * @param {import('express').Request} req - req.user inyectado por middleware authenticate
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>} JSON con datos de la suscripción
 */
const getSubscriptionStatus = async (req, res, next) => {
  try {
    const { companyId } = req.user;
    const status = await stripeService.getSubscriptionStatus(companyId);
    res.status(200).json({ success: true, data: status });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createCheckoutSession,
  handleWebhook,
  getPortalSession,
  getSubscriptionStatus,
};
