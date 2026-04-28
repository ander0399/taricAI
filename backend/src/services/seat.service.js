const Stripe = require('stripe');
const { Company, User, Subscription } = require('../models');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const TEAM_SEAT_LIMIT = 15;

/**
 * @description Sincroniza el quantity de la suscripción Stripe con el número de usuarios
 *              activos de la empresa. Solo ejecuta si la empresa tiene Plan Team y
 *              stripeSubscriptionId — para otros planes es un no-op silencioso.
 *              Stripe aplica prorrateo automático al cambiar el quantity.
 * @param {string} companyId - UUID de la empresa a sincronizar
 * @returns {Promise<void>}
 * @throws {Error} Si activeCount supera el límite de 15 seats del Plan Team
 */
const syncStripeSeats = async (companyId) => {
  const company = await Company.findByPk(companyId);

  // No-op: solo aplica al Plan Team con suscripción Stripe activa
  if (!company || company.plan !== 'team' || !company.stripeSubscriptionId) {
    return;
  }

  const activeCount = await User.count({ where: { companyId, activo: true } });

  // Guard mínimo: el owner siempre debe ser activo
  const safeCount = Math.max(activeCount, 1);

  // Guard máximo: el Plan Team no puede superar 15 seats
  if (safeCount > TEAM_SEAT_LIMIT) {
    const err = new Error(
      `Has alcanzado el límite de ${TEAM_SEAT_LIMIT} usuarios del Plan Team. Considera el Plan Enterprise para equipos más grandes.`
    );
    err.status = 403;
    throw err;
  }

  // Obtener el quantity actual en DB para loggear el cambio
  const suscripcion = await Subscription.findOne({ where: { companyId } });
  const prevCount = suscripcion?.quantity ?? 0;

  // Actualizar quantity en Stripe con prorrateo explícito
  // proration_behavior: 'create_prorations' aplica crédito/cargo por los días restantes del ciclo
  await stripe.subscriptions.update(company.stripeSubscriptionId, {
    items: [
      {
        id: (await stripe.subscriptions.retrieve(company.stripeSubscriptionId)).items.data[0].id,
        quantity: safeCount,
      },
    ],
    proration_behavior: 'create_prorations',
  });

  // Persistir el nuevo quantity en DB local para que el frontend lo refleje sin llamar a Stripe
  if (suscripcion) {
    await suscripcion.update({ quantity: safeCount });
  }

  console.log(`[SEATS] Company ${companyId}: ${prevCount} → ${safeCount} seats activos`);
};

module.exports = { syncStripeSeats };
