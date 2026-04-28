const { Op } = require('sequelize');
const { Company, User, Subscription, Classifications } = require('../models');
const { stripe, createCheckoutSession, findOrCreateStripeCustomer } = require('./stripe.service');

/** Límites de clasificaciones mensuales por plan — fuente de verdad del backend */
const PLAN_LIMITS = {
  free:       5,
  pro:        50,
  team:       2000,
  enterprise: null, // null = ilimitado
};

/** Precio de Stripe por plan — resueltos en runtime desde .env */
const resolvePriceId = (planId) => {
  const map = {
    pro:  process.env.STRIPE_PRICE_ID_PRO,
    team: process.env.STRIPE_PRICE_ID_TEAM,
  };
  if (!map[planId]) {
    const err = new Error(`price_id no configurado para plan "${planId}".`);
    err.status = 500;
    throw err;
  }
  return map[planId];
};

/**
 * @description Verifica que el userId sea el owner de companyId.
 *              Se llama al inicio de cada operación de cambio de plan para
 *              garantizar que solo el propietario pueda modificar la suscripción.
 * @param {string} userId    - UUID del usuario autenticado (del JWT)
 * @param {string} companyId - UUID de la empresa
 * @throws {Error} 403 si el usuario no es owner de la empresa
 */
const assertOwner = async (userId, companyId) => {
  const user = await User.findOne({ where: { id: userId, companyId } });
  if (!user || user.role !== 'owner') {
    const err = new Error('Solo el propietario puede modificar el plan.');
    err.status = 403;
    err.code   = 'NOT_OWNER';
    throw err;
  }
};

/**
 * @description Obtiene el plan activo y uso mensual de la empresa.
 *              Cuenta las clasificaciones del mes en curso para calcular
 *              el porcentaje de uso respecto al límite del plan.
 * @param {string} companyId - UUID de la empresa del usuario autenticado
 * @returns {Promise<{
 *   plan: string,
 *   stripeStatus: string,
 *   usage: { used: number, limit: number | null },
 *   currentPeriodEnd: Date | null,
 *   cancelAtPeriodEnd: boolean
 * }>}
 */
const getCurrentPlan = async (companyId) => {
  const now       = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [subscription, usedCount] = await Promise.all([
    Subscription.findOne({ where: { companyId }, order: [['createdAt', 'DESC']] }),
    Classifications.count({
      where: { companyId, createdAt: { [Op.gte]: monthStart } },
    }),
  ]);

  const plan = subscription?.plan ?? 'free';

  return {
    plan,
    stripeStatus:      subscription?.stripeStatus      ?? 'active',
    cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd ?? false,
    currentPeriodEnd:  subscription?.currentPeriodEnd  ?? null,
    usage: {
      used:  usedCount,
      limit: PLAN_LIMITS[plan] ?? null,
    },
  };
};

/**
 * @description Ejecuta un upgrade de plan de forma inmediata con prorrateo.
 *              Si la empresa no tiene suscripción Stripe (viene de Free), crea
 *              una nueva Checkout Session. Si ya tiene suscripción activa,
 *              actualiza el price_id directamente en Stripe con prorrateo.
 * @param {string} companyId - UUID de la empresa en la base de datos
 * @param {string} newPlan   - 'pro' | 'team'
 * @param {string} userId    - UUID del usuario solicitante (debe ser owner)
 * @returns {Promise<{ type: 'checkout' | 'updated', redirectUrl?: string }>}
 * @throws {Error} 403 si userId no es owner | 400 si plan inválido | 409 si ya tiene ese plan
 */
const upgradePlan = async (companyId, newPlan, userId) => {
  await assertOwner(userId, companyId);

  if (!['pro', 'team'].includes(newPlan)) {
    const err = new Error('Plan no válido. Opciones: pro, team, enterprise.');
    err.status = 400;
    err.code   = 'INVALID_PLAN';
    throw err;
  }

  const subscription = await Subscription.findOne({
    where: { companyId },
    order: [['createdAt', 'DESC']],
  });

  if (subscription?.plan === newPlan && subscription?.stripeStatus === 'active') {
    const err = new Error('Ya tienes este plan activo.');
    err.status = 409;
    err.code   = 'SAME_PLAN';
    throw err;
  }

  // Sin suscripción Stripe activa (plan Free o suscripción cancelada) → nuevo Checkout
  if (!subscription?.stripePriceId || subscription.stripeStatus === 'cancelled') {
    const url = await createCheckoutSession(companyId, userId, newPlan);
    return { type: 'checkout', redirectUrl: url };
  }

  // Con suscripción activa → actualizar directamente en Stripe con prorrateo inmediato
  const company = await Company.findByPk(companyId);
  const stripeSub = await stripe.subscriptions.retrieve(company.stripeSubscriptionId);

  await stripe.subscriptions.update(company.stripeSubscriptionId, {
    items: [{ id: stripeSub.items.data[0].id, price: resolvePriceId(newPlan) }],
    proration_behavior:  'create_prorations',
    billing_cycle_anchor: 'unchanged',
  });

  // Actualizar inmediatamente en DB — el webhook confirmará el estado final
  await subscription.update({ plan: newPlan, stripePriceId: resolvePriceId(newPlan) });
  await company.update({ plan: newPlan });

  return { type: 'updated' };
};

/**
 * @description Programa un downgrade de plan para el final del ciclo actual.
 *              Si el nuevo plan es Free: activa cancel_at_period_end=true.
 *              El webhook customer.subscription.deleted maneja la transición final.
 *              Si el nuevo plan es Pro/Team: actualiza el price_id con
 *              billing_cycle_anchor: 'unchanged' y proration_behavior: 'none'.
 * @param {string} companyId - UUID de la empresa en la base de datos
 * @param {string} newPlan   - 'free' | 'pro' | 'team'
 * @param {string} userId    - UUID del usuario solicitante (debe ser owner)
 * @returns {Promise<{ effectiveDate: Date, newPlan: string }>}
 * @throws {Error} 403 si userId no es owner | 404 si no hay suscripción activa
 */
const downgradePlan = async (companyId, newPlan, userId) => {
  await assertOwner(userId, companyId);

  const company      = await Company.findByPk(companyId);
  const subscription = await Subscription.findOne({
    where: { companyId },
    order: [['createdAt', 'DESC']],
  });

  if (!subscription?.stripePriceId || !company?.stripeSubscriptionId) {
    const err = new Error('Esta empresa no tiene suscripción activa en Stripe.');
    err.status = 404;
    err.code   = 'NO_SUBSCRIPTION';
    throw err;
  }

  if (newPlan === 'free') {
    // Downgrade a Free = cancelación al fin del ciclo, NO cambio de price_id
    // No existe price_id para Free en Stripe
    await stripe.subscriptions.update(company.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });
    await subscription.update({ cancelAtPeriodEnd: true });
  } else {
    // Downgrade a Pro/Team — sin prorrateo, efectivo al próximo ciclo
    const stripeSub = await stripe.subscriptions.retrieve(company.stripeSubscriptionId);
    await stripe.subscriptions.update(company.stripeSubscriptionId, {
      items: [{ id: stripeSub.items.data[0].id, price: resolvePriceId(newPlan) }],
      proration_behavior:   'none',
      billing_cycle_anchor: 'unchanged',
    });
    await subscription.update({ cancelAtPeriodEnd: false });
  }

  return {
    effectiveDate: subscription.currentPeriodEnd,
    newPlan,
  };
};

/**
 * @description Cancela la suscripción activa al final del ciclo actual.
 *              El acceso se mantiene hasta currentPeriodEnd.
 *              Al expirar, el webhook customer.subscription.deleted
 *              degradará automáticamente el plan a Free.
 * @param {string} companyId - UUID de la empresa
 * @param {string} userId    - UUID del usuario (debe ser owner)
 * @returns {Promise<{ cancelDate: Date }>} Fecha de cancelación efectiva
 * @throws {Error} 403 si userId no es owner | 404 si no hay suscripción activa
 */
const cancelSubscription = async (companyId, userId) => {
  await assertOwner(userId, companyId);

  const company      = await Company.findByPk(companyId);
  const subscription = await Subscription.findOne({
    where: { companyId },
    order: [['createdAt', 'DESC']],
  });

  if (!company?.stripeSubscriptionId) {
    const err = new Error('Esta empresa no tiene suscripción activa en Stripe.');
    err.status = 404;
    err.code   = 'NO_SUBSCRIPTION';
    throw err;
  }

  await stripe.subscriptions.update(company.stripeSubscriptionId, {
    cancel_at_period_end: true,
  });

  await subscription?.update({ cancelAtPeriodEnd: true });

  return { cancelDate: subscription?.currentPeriodEnd ?? null };
};

/**
 * @description Reactiva una suscripción marcada como cancel_at_period_end: true,
 *              antes de que llegue la fecha de cancelación.
 * @param {string} companyId - UUID de la empresa
 * @param {string} userId    - UUID del usuario (debe ser owner)
 * @returns {Promise<{ reactivated: true, nextRenewal: Date }>}
 * @throws {Error} 403 si userId no es owner | 400 si la suscripción ya está cancelada
 */
const reactivateSubscription = async (companyId, userId) => {
  await assertOwner(userId, companyId);

  const company      = await Company.findByPk(companyId);
  const subscription = await Subscription.findOne({
    where: { companyId },
    order: [['createdAt', 'DESC']],
  });

  if (!company?.stripeSubscriptionId) {
    const err = new Error('Esta empresa no tiene suscripción activa en Stripe.');
    err.status = 404;
    err.code   = 'NO_SUBSCRIPTION';
    throw err;
  }

  if (subscription?.stripeStatus === 'cancelled') {
    const err = new Error('La suscripción ya está cancelada definitivamente. Crea una nueva.');
    err.status = 400;
    throw err;
  }

  await stripe.subscriptions.update(company.stripeSubscriptionId, {
    cancel_at_period_end: false,
  });

  await subscription?.update({ cancelAtPeriodEnd: false });

  return { reactivated: true, nextRenewal: subscription?.currentPeriodEnd ?? null };
};

module.exports = {
  getCurrentPlan,
  upgradePlan,
  downgradePlan,
  cancelSubscription,
  reactivateSubscription,
};
