const { Subscription } = require('../../src/models');
const { COMPANY_IDS, SUBSCRIPTION_IDS } = require('../helpers/uuid.helper');
const { getPeriodDates, getExpiredPeriodDates, getAnnualPeriodEnd } = require('../helpers/dates.helper');

/**
 * @description Inserta 1 suscripción por empresa (5 en total).
 * - Free:       todos los campos Stripe en null
 * - Pro/Team:   stripePriceId desde .env con fallback literal
 * - Enterprise: stripePriceId null (configuración manual)
 * - Adriatica:  stripeStatus 'past_due', fechas del período anterior vencido
 *
 * @param {import('sequelize').Transaction} t
 * @returns {Promise<void>}
 */
async function seedSubscriptions(t) {
  const { start: activeStart, end: activeEnd } = getPeriodDates();
  const { start: expiredStart, end: expiredEnd } = getExpiredPeriodDates();

  const PRICE_PRO  = process.env.STRIPE_PRICE_ID_PRO  || 'PRICE_PRO_NOT_CONFIGURED';
  const PRICE_TEAM = process.env.STRIPE_PRICE_ID_TEAM || 'PRICE_TEAM_NOT_CONFIGURED';

  const subscriptions = [
    // 1 — Logística Andina (Free): sin Stripe
    {
      id: SUBSCRIPTION_IDS.andina,
      companyId: COMPANY_IDS.andina,
      plan: 'free',
      stripeStatus: 'active',
      stripePriceId: null,
      quantity: 1,
      currentPeriodStart: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    },
    // 2 — GlobalTrade Solutions (Pro)
    {
      id: SUBSCRIPTION_IDS.globaltrade,
      companyId: COMPANY_IDS.globaltrade,
      plan: 'pro',
      stripeStatus: 'active',
      stripePriceId: PRICE_PRO,
      quantity: 1,
      currentPeriodStart: activeStart,
      currentPeriodEnd: activeEnd,
      cancelAtPeriodEnd: false,
    },
    // 3 — ComerExport Group (Team activo — 8 seats)
    {
      id: SUBSCRIPTION_IDS.comerexport,
      companyId: COMPANY_IDS.comerexport,
      plan: 'team',
      stripeStatus: 'active',
      stripePriceId: PRICE_TEAM,
      quantity: 8,
      currentPeriodStart: activeStart,
      currentPeriodEnd: activeEnd,
      cancelAtPeriodEnd: false,
    },
    // 4 — Adriatica Imports EU (Team past_due — pago fallido hace 5 días)
    {
      id: SUBSCRIPTION_IDS.adriatica,
      companyId: COMPANY_IDS.adriatica,
      plan: 'team',
      stripeStatus: 'past_due',
      stripePriceId: PRICE_TEAM,
      quantity: 4,
      currentPeriodStart: expiredStart,
      currentPeriodEnd: expiredEnd,
      cancelAtPeriodEnd: false,
    },
    // 5 — Nexus Enterprise Corp (Enterprise — contrato semianual, sin price_id)
    {
      id: SUBSCRIPTION_IDS.nexus,
      companyId: COMPANY_IDS.nexus,
      plan: 'enterprise',
      stripeStatus: 'active',
      stripePriceId: null,
      quantity: 6,
      currentPeriodStart: activeStart,
      currentPeriodEnd: getAnnualPeriodEnd(),
      cancelAtPeriodEnd: false,
    },
  ];

  await Subscription.bulkCreate(subscriptions, {
    transaction: t,
    updateOnDuplicate: ['plan', 'stripeStatus', 'stripePriceId', 'quantity', 'currentPeriodStart', 'currentPeriodEnd', 'cancelAtPeriodEnd', 'updatedAt'],
  });
  console.log(`  ✓ Subscriptions: ${subscriptions.length} registros insertados`);
}

module.exports = { seedSubscriptions };
