import api from './api';

/**
 * @description Inicia una sesión de Stripe Checkout para el plan seleccionado.
 *              El token JWT del header es suficiente — el backend extrae companyId del JWT.
 * @param {string} planId - 'pro' | 'team'
 * @returns {Promise<{url: string}>} URL de redirección al hosted checkout de Stripe
 */
export async function createCheckoutSession(planId) {
  const { data } = await api.post('/stripe/create-checkout-session', { planId });
  return data;
}

/**
 * @description Crea una sesión del Stripe Customer Portal para gestionar tarjeta y facturas.
 * @returns {Promise<{url: string}>} URL del Customer Portal de Stripe
 */
export async function getPortalSession() {
  const { data } = await api.get('/stripe/portal-session');
  return data;
}

/**
 * @description Retorna el estado actual de la suscripción de la empresa del usuario autenticado.
 * @returns {Promise<{plan: string, stripeStatus: string, quantity: number, currentPeriodEnd: string}>}
 */
export async function getSubscriptionStatus() {
  const { data } = await api.get('/stripe/subscription-status');
  return data;
}

/**
 * @description Envía el formulario de contacto Enterprise al backend.
 * @param {Object} payload
 * @param {string} payload.name
 * @param {string} payload.email
 * @param {string} payload.company
 * @param {string} payload.country
 * @param {number} payload.usersCount - Mínimo 15
 * @param {string} [payload.volume]
 * @param {string} [payload.message]
 * @returns {Promise<{ok: boolean, message: string}>}
 */
export async function sendEnterpriseContact(payload) {
  const { data } = await api.post('/enterprise/contact', payload);
  return data;
}
