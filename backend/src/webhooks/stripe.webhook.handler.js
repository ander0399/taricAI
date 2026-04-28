const { Company, User, Subscription } = require('../models');
const {
  enviarBienvenidaPlan,
  enviarPagoFallido,
  enviarSuscripcionCancelada,
  enviarReciboPago,
} = require('../services/emailService');

/**
 * @description Obtiene el email del owner de una empresa para enviar notificaciones de pago.
 *              El owner siempre existe y es único por empresa.
 * @param {string} companyId - UUID de la empresa
 * @returns {Promise<{email: string, nombre: string}>}
 */
const getOwnerDatos = async (companyId) => {
  const owner = await User.findOne({ where: { companyId, role: 'owner' } });
  return { email: owner?.email || '', nombre: owner?.nombre || '' };
};

/**
 * @description Manejador del evento checkout.session.completed.
 *              Activa la suscripción en DB al confirmar el pago del checkout.
 *              Este es el punto de verdad para activar acceso al plan — no el frontend.
 * @param {import('stripe').Stripe.CheckoutSessionCompletedEvent['data']['object']} session
 * @returns {Promise<void>}
 */
const onCheckoutSessionCompleted = async (session) => {
  const { companyId, planId } = session.metadata;
  const stripeSubscriptionId = session.subscription;
  const stripeCustomerId = session.customer;

  if (!companyId || !planId) {
    console.error('[Webhook] checkout.session.completed sin metadata companyId/planId');
    return;
  }

  const company = await Company.findByPk(companyId);
  if (!company) {
    console.error(`[Webhook] Empresa no encontrada: ${companyId}`);
    return;
  }

  // Guardar IDs de Stripe en Company para reutilizarlos en eventos futuros
  await company.update({ plan: planId, stripeCustomerId, stripeSubscriptionId });

  // Actualizar el registro de Subscription existente (creado en Free al registrar)
  // o crear uno nuevo si por alguna razón no existe
  const quantity = planId === 'team'
    ? await User.count({ where: { companyId, activo: true } })
    : 1;

  const subscriptionData = {
    plan: planId,
    stripeStatus: 'active',
    stripePriceId: planId === 'pro'
      ? process.env.STRIPE_PRICE_ID_PRO
      : process.env.STRIPE_PRICE_ID_TEAM,
    quantity,
  };

  const [sub, created] = await Subscription.findOrCreate({
    where: { companyId },
    defaults: { ...subscriptionData, companyId },
  });

  // Si ya existía (caso normal: registro Free → upgrade), actualizar sus campos
  if (!created) {
    await sub.update(subscriptionData);
  }

  const { email, nombre } = await getOwnerDatos(companyId);
  await enviarBienvenidaPlan({ destinatario: email, nombre, plan: planId });

  console.log(`[Webhook] checkout.session.completed → Company ${companyId} activada en plan ${planId}`);
};

/**
 * @description Manejador del evento customer.subscription.updated.
 *              Sincroniza plan, quantity, status y fechas del período en la DB local.
 *              Se dispara en cambios de plan, cancelación programada y renovaciones.
 * @param {import('stripe').Stripe.Subscription} subscription
 * @returns {Promise<void>}
 */
const onSubscriptionUpdated = async (subscription) => {
  // companyId viene en metadata porque lo incluimos en subscription_data.metadata al crear la session
  const companyId = subscription.metadata?.companyId;
  if (!companyId) return;

  const stripeItem = subscription.items?.data?.[0];

  await Subscription.update(
    {
      stripeStatus: subscription.status,
      quantity: stripeItem?.quantity ?? 1,
      stripePriceId: stripeItem?.price?.id ?? null,
      // Stripe retorna timestamps UNIX en segundos — convertir a ms para Date
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
    { where: { companyId } }
  );

  console.log(`[Webhook] subscription.updated → Company ${companyId}: status=${subscription.status}, qty=${stripeItem?.quantity}`);
};

/**
 * @description Manejador del evento customer.subscription.deleted.
 *              Marca la suscripción como cancelada y degrada la empresa a plan Free.
 *              Notifica al owner para que pueda reactivar desde /pricing.
 * @param {import('stripe').Stripe.Subscription} subscription
 * @returns {Promise<void>}
 */
const onSubscriptionDeleted = async (subscription) => {
  const companyId = subscription.metadata?.companyId;
  if (!companyId) return;

  // Degradar plan a free y limpiar IDs de Stripe en Company
  await Company.update(
    { plan: 'free', stripeSubscriptionId: null },
    { where: { id: companyId } }
  );

  await Subscription.update(
    { stripeStatus: 'cancelled' },
    { where: { companyId } }
  );

  const { email, nombre } = await getOwnerDatos(companyId);
  await enviarSuscripcionCancelada({ destinatario: email, nombre });

  console.log(`[Webhook] subscription.deleted → Company ${companyId} degradada a free`);
};

/**
 * @description Manejador del evento invoice.payment_succeeded.
 *              Renueva las fechas del período y envía el recibo de pago al owner.
 *              Solo procesa facturas de suscripción (no one-time charges).
 * @param {import('stripe').Stripe.Invoice} invoice
 * @returns {Promise<void>}
 */
const onPaymentSucceeded = async (invoice) => {
  // Ignorar facturas sin suscripción (pagos únicos no relacionados al módulo)
  if (!invoice.subscription) return;

  const company = await Company.findOne({
    where: { stripeSubscriptionId: invoice.subscription },
  });
  if (!company) return;

  await Subscription.update(
    {
      stripeStatus: 'active',
      currentPeriodEnd: invoice.period_end
        ? new Date(invoice.period_end * 1000)
        : undefined,
    },
    { where: { companyId: company.id } }
  );

  const { email, nombre } = await getOwnerDatos(company.id);
  await enviarReciboPago({
    destinatario: email,
    nombre,
    montoCobrado: (invoice.amount_paid / 100).toFixed(2),
    moneda: invoice.currency.toUpperCase(),
    linkFactura: invoice.hosted_invoice_url,
    periodEnd: invoice.period_end
      ? new Date(invoice.period_end * 1000).toLocaleDateString('es-ES')
      : '',
  });

  console.log(`[Webhook] invoice.payment_succeeded → Company ${company.id}, $${invoice.amount_paid / 100}`);
};

/**
 * @description Manejador del evento invoice.payment_failed.
 *              Marca la suscripción como past_due y notifica al owner con link al portal
 *              para que actualice su método de pago antes de la suspensión automática.
 * @param {import('stripe').Stripe.Invoice} invoice
 * @returns {Promise<void>}
 */
const onPaymentFailed = async (invoice) => {
  if (!invoice.subscription) return;

  const company = await Company.findOne({
    where: { stripeSubscriptionId: invoice.subscription },
  });
  if (!company) return;

  await Subscription.update(
    { stripeStatus: 'past_due' },
    { where: { companyId: company.id } }
  );

  const { email, nombre } = await getOwnerDatos(company.id);
  const portalUrl = `${process.env.FRONTEND_URL}/dashboard/billing`;

  await enviarPagoFallido({ destinatario: email, nombre, portalUrl });

  console.log(`[Webhook] invoice.payment_failed → Company ${company.id} marcada past_due`);
};

/**
 * @description Despacha el evento de Stripe al handler correspondiente.
 *              Eventos sin handler definido se ignoran silenciosamente (respuesta 200 garantizada).
 * @param {import('stripe').Stripe.Event} event - Evento validado por constructEvent
 * @returns {Promise<void>}
 */
const handleStripeEvent = async (event) => {
  const obj = event.data.object;

  switch (event.type) {
    case 'checkout.session.completed':
      await onCheckoutSessionCompleted(obj);
      break;

    case 'customer.subscription.updated':
      await onSubscriptionUpdated(obj);
      break;

    case 'customer.subscription.deleted':
      await onSubscriptionDeleted(obj);
      break;

    case 'invoice.payment_succeeded':
      await onPaymentSucceeded(obj);
      break;

    case 'invoice.payment_failed':
      await onPaymentFailed(obj);
      break;

    case 'customer.subscription.trial_will_end':
      // Placeholder para cuando se implemente trial — el evento se recibe y descarta sin error
      console.log(`[Webhook] trial_will_end recibido para suscripción ${obj.id} — sin handler activo`);
      break;

    default:
      // Eventos no manejados se ignoran — Stripe no debe recibir error por eventos futuros
      console.log(`[Webhook] Evento no manejado: ${event.type}`);
  }
};

module.exports = { handleStripeEvent };
