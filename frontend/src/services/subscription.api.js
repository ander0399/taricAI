import api from './api';

/**
 * @description Obtiene el plan activo, uso del mes y fecha de renovación
 *              de la empresa autenticada. El JWT del interceptor identifica
 *              automáticamente a qué empresa pertenece el request.
 * @returns {Promise<{
 *   plan: string,
 *   stripeStatus: string,
 *   usage: { used: number, limit: number },
 *   currentPeriodEnd: string | null,
 *   cancelAtPeriodEnd: boolean
 * }>}
 */
export const getCurrentPlan = () =>
  api.get('/subscription/current').then((r) => r.data.data);

/**
 * @description Inicia un upgrade de plan. Si la empresa viene de Free (sin Stripe),
 *              devuelve una redirectUrl a Stripe Checkout. Si ya tiene suscripción
 *              activa, actualiza directamente y devuelve { type: 'updated' }.
 * @param {string} newPlan - 'pro' | 'team'
 * @returns {Promise<{ type: 'checkout' | 'updated', redirectUrl?: string }>}
 */
export const upgradePlan = (newPlan) =>
  api.post('/subscription/upgrade', { newPlan }).then((r) => r.data.data);

/**
 * @description Programa un downgrade para el fin del ciclo actual.
 *              El acceso al plan actual se mantiene hasta currentPeriodEnd.
 * @param {string} newPlan - 'free' | 'pro' | 'team'
 * @returns {Promise<{ effectiveDate: string, newPlan: string }>}
 */
export const downgradePlan = (newPlan) =>
  api.post('/subscription/downgrade', { newPlan }).then((r) => r.data.data);

/**
 * @description Cancela la suscripción al final del ciclo actual.
 * @returns {Promise<{ cancelDate: string }>}
 */
export const cancelSubscription = () =>
  api.post('/subscription/cancel').then((r) => r.data.data);

/**
 * @description Reactiva una suscripción marcada para cancelar antes de que venza.
 * @returns {Promise<{ reactivated: true, nextRenewal: string }>}
 */
export const reactivateSubscription = () =>
  api.post('/subscription/reactivate').then((r) => r.data.data);

/**
 * @description Genera la URL del Stripe Customer Portal para gestión de
 *              tarjetas, facturas e historial de pagos.
 * @returns {Promise<{ url: string }>}
 */
export const getPortalSession = () =>
  api.get('/stripe/portal-session').then((r) => r.data.data);
