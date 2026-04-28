const subscriptionService = require('../services/subscription.service');

/**
 * @description Retorna el plan activo, uso mensual y estado Stripe de la empresa.
 *              Accesible para todos los roles autenticados (owner, admin, member).
 */
const getCurrent = async (req, res, next) => {
  try {
    const data = await subscriptionService.getCurrentPlan(req.user.companyId);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/**
 * @description Inicia un upgrade de plan con efecto inmediato y prorrateo.
 *              Si la empresa viene de Free, retorna una redirectUrl a Stripe Checkout.
 *              Solo accesible para el owner (verificado en el service).
 */
const upgrade = async (req, res, next) => {
  try {
    const { newPlan } = req.body;
    const data = await subscriptionService.upgradePlan(
      req.user.companyId,
      newPlan,
      req.user.userId,
    );
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/**
 * @description Programa un downgrade al final del ciclo actual.
 *              Solo accesible para el owner (verificado en el service).
 */
const downgrade = async (req, res, next) => {
  try {
    const { newPlan } = req.body;
    const data = await subscriptionService.downgradePlan(
      req.user.companyId,
      newPlan,
      req.user.userId,
    );
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/**
 * @description Cancela la suscripción al final del ciclo actual.
 *              Solo accesible para el owner (verificado en el service).
 */
const cancel = async (req, res, next) => {
  try {
    const data = await subscriptionService.cancelSubscription(
      req.user.companyId,
      req.user.userId,
    );
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/**
 * @description Reactiva una suscripción antes de que venza cancel_at_period_end.
 *              Solo accesible para el owner (verificado en el service).
 */
const reactivate = async (req, res, next) => {
  try {
    const data = await subscriptionService.reactivateSubscription(
      req.user.companyId,
      req.user.userId,
    );
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

module.exports = { getCurrent, upgrade, downgrade, cancel, reactivate };
