const Stripe = require('stripe');
const { Company, User, Subscription } = require('../models');

// Inicializar cliente Stripe con la clave secreta del entorno
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * @description Resuelve el price_id de Stripe según el planId interno.
 *              Los price_ids se crean en el Stripe Dashboard y se almacenan en .env.
 * @param {string} planId - 'pro' | 'team'
 * @returns {string} price_id de Stripe correspondiente
 * @throws {Error} Si el planId no tiene price_id configurado en variables de entorno
 */
const resolvePriceId = (planId) => {
  const map = {
    pro: process.env.STRIPE_PRICE_ID_PRO,
    team: process.env.STRIPE_PRICE_ID_TEAM,
  };
  const priceId = map[planId];
  if (!priceId) {
    const err = new Error(`price_id no configurado para el plan "${planId}". Verifica las variables de entorno.`);
    err.status = 500;
    throw err;
  }
  return priceId;
};

/**
 * @description Busca el Stripe Customer existente de la empresa o crea uno nuevo.
 *              Reutilizar el mismo Customer evita duplicados en el dashboard de Stripe
 *              y mantiene el historial de facturas unificado.
 * @param {object} company - Instancia Sequelize de Company
 * @param {string} ownerEmail - Email del owner para crear el Customer si no existe
 * @returns {Promise<string>} stripeCustomerId (cus_xxx)
 */
const findOrCreateStripeCustomer = async (company, ownerEmail) => {
  if (company.stripeCustomerId) {
    return company.stripeCustomerId;
  }

  // Crear Customer en Stripe con los datos de la empresa
  const customer = await stripe.customers.create({
    email: ownerEmail,
    name: company.nombre,
    metadata: { companyId: company.id },
  });

  // Persistir el ID para reutilizarlo en checkouts futuros sin crear duplicados
  await company.update({ stripeCustomerId: customer.id });

  return customer.id;
};

/**
 * @description Crea una Stripe Checkout Session para los planes Pro o Team.
 *              Para Plan Team calcula el quantity inicial contando los usuarios activos.
 *              Retorna la URL de redirección al hosted checkout de Stripe.
 * @param {string} companyId - UUID de la empresa del usuario autenticado
 * @param {string} userId - UUID del usuario autenticado (owner)
 * @param {string} planId - 'pro' | 'team'
 * @returns {Promise<string>} URL de Checkout de Stripe
 * @throws {Error} Si el plan es inválido, ya existe suscripción activa, o Stripe falla
 */
const createCheckoutSession = async (companyId, userId, planId) => {
  if (!['pro', 'team'].includes(planId)) {
    const err = new Error('Plan inválido. Solo se aceptan: pro, team');
    err.status = 400;
    throw err;
  }

  const company = await Company.findByPk(companyId);
  if (!company) {
    const err = new Error('Empresa no encontrada.');
    err.status = 404;
    throw err;
  }

  // Evitar duplicar suscripciones activas en el mismo plan
  const suscripcionActiva = await Subscription.findOne({
    where: { companyId, plan: planId, stripeStatus: 'active' },
  });
  if (suscripcionActiva) {
    const err = new Error('Ya tienes una suscripción activa en este plan.');
    err.status = 409;
    throw err;
  }

  // Obtener el email del owner para crear/identificar el Customer en Stripe
  const owner = await User.findByPk(userId);
  const stripeCustomerId = await findOrCreateStripeCustomer(company, owner.email);
  const priceId = resolvePriceId(planId);

  // Para Plan Team, el quantity inicial = usuarios activos actuales (mínimo 1 = el owner)
  let quantity = 1;
  if (planId === 'team') {
    quantity = await User.count({ where: { companyId, activo: true } });
    quantity = Math.max(quantity, 1);
  }

  // Construir la Checkout Session — mode 'subscription' para billing recurrente
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: stripeCustomerId,
    line_items: [{ price: priceId, quantity }],
    success_url: `${process.env.FRONTEND_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.FRONTEND_URL}/#planes`,
    // Metadata propagado al webhook checkout.session.completed para identificar la empresa
    metadata: { companyId, userId, planId },
    subscription_data: {
      metadata: { companyId, planId },
    },
  });

  return session.url;
};

/**
 * @description Crea una sesión del Stripe Customer Portal para que el owner gestione
 *              su tarjeta, facturas y cancelación sin pasar por el backend de TaricAI.
 * @param {string} companyId - UUID de la empresa del usuario autenticado
 * @returns {Promise<string>} URL del Customer Portal de Stripe
 * @throws {Error} Si la empresa no tiene stripeCustomerId (nunca ha pagado)
 */
const createPortalSession = async (companyId) => {
  const company = await Company.findByPk(companyId);

  if (!company?.stripeCustomerId) {
    const err = new Error('No hay una suscripción de pago activa para acceder al portal.');
    err.status = 400;
    throw err;
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: company.stripeCustomerId,
    return_url: `${process.env.FRONTEND_URL}/dashboard`,
  });

  return session.url;
};

/**
 * @description Retorna el estado actual de la suscripción de la empresa.
 *              Incluye plan, stripeStatus, fechas del período y seats (Plan Team).
 * @param {string} companyId - UUID de la empresa del usuario autenticado
 * @returns {Promise<object>} Datos de la suscripción o plan free por defecto
 */
const getSubscriptionStatus = async (companyId) => {
  const suscripcion = await Subscription.findOne({
    where: { companyId },
    order: [['createdAt', 'DESC']],
  });

  if (!suscripcion) {
    return { plan: 'free', stripeStatus: 'active', quantity: 1 };
  }

  return {
    plan: suscripcion.plan,
    stripeStatus: suscripcion.stripeStatus,
    quantity: suscripcion.quantity,
    currentPeriodStart: suscripcion.currentPeriodStart,
    currentPeriodEnd: suscripcion.currentPeriodEnd,
    cancelAtPeriodEnd: suscripcion.cancelAtPeriodEnd,
  };
};

module.exports = {
  stripe,
  createCheckoutSession,
  createPortalSession,
  getSubscriptionStatus,
  findOrCreateStripeCustomer,
};
