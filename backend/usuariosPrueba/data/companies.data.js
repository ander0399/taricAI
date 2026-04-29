const { COMPANY_IDS, USER_IDS } = require('../helpers/uuid.helper');

/**
 * @description Datos de las 5 empresas de prueba.
 * propietarioId apunta al owner de cada empresa (FK circular resuelta por el seeder:
 * se crea Company con propietarioId=null, luego User, luego se actualiza propietarioId).
 * Los IDs de Stripe tienen prefijo 'cus_seed_' y 'sub_seed_' — no son IDs reales.
 */
const COMPANIES = [
  {
    id: COMPANY_IDS.andina,
    nombre: 'Logística Andina S.A.S',
    plan: 'free',
    propietarioId: USER_IDS.owner_andina,
    stripeCustomerId: null,       // Free: sin objeto Stripe
    stripeSubscriptionId: null,   // Free: sin objeto Stripe
  },
  {
    id: COMPANY_IDS.globaltrade,
    nombre: 'GlobalTrade Solutions',
    plan: 'pro',
    propietarioId: USER_IDS.owner_globaltrade,
    stripeCustomerId: 'cus_seed_globaltrade_001',
    stripeSubscriptionId: 'sub_seed_globaltrade_001',
  },
  {
    id: COMPANY_IDS.comerexport,
    nombre: 'ComerExport Group',
    plan: 'team',
    propietarioId: USER_IDS.owner_comer,
    stripeCustomerId: 'cus_seed_comerexport_001',
    stripeSubscriptionId: 'sub_seed_comerexport_001',
  },
  {
    id: COMPANY_IDS.adriatica,
    nombre: 'Adriatica Imports EU',
    plan: 'team',
    propietarioId: USER_IDS.owner_adriatica,
    stripeCustomerId: 'cus_seed_adriatica_001',
    stripeSubscriptionId: 'sub_seed_adriatica_001',
  },
  {
    id: COMPANY_IDS.nexus,
    nombre: 'Nexus Enterprise Corp',
    plan: 'enterprise',
    propietarioId: USER_IDS.owner_nexus,
    stripeCustomerId: 'cus_seed_nexus_001',
    stripeSubscriptionId: 'sub_seed_nexus_001',
  },
];

module.exports = { COMPANIES };
