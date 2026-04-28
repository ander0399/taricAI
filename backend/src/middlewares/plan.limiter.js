const { Op } = require('sequelize');
const { Classifications, Subscription } = require('../models');
const TIER_LIMITS = require('../config/tiers');

/**
 * @description Middleware que valida el límite mensual de clasificaciones según el plan activo.
 * Debe ejecutarse DESPUÉS de verifyJWT. Orden: verifyJWT → planLimiter → controller.
 *
 * Lógica de conteo:
 * - Free / Pro:        cuenta clasificaciones del usuario individual (countByUser: true)
 * - Team / Enterprise: cuenta clasificaciones de toda la empresa (countByUser: false)
 *
 * En caso de límite excedido responde HTTP 429 con upgrade URL.
 * En caso de suscripción inactiva (past_due/cancelled) responde HTTP 403.
 * Si el plan no tiene límite (Enterprise, Infinity) pasa directo a next().
 *
 * @param {import('express').Request} req - Debe tener req.user con { id, companyId }
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const planLimiter = async (req, res, next) => {
  try {
    const { userId, companyId } = req.user;

    // Obtener suscripción activa de la empresa
    const subscription = await Subscription.findOne({ where: { companyId } });

    if (!subscription) {
      return res.status(403).json({
        error: 'SUBSCRIPTION_NOT_FOUND',
        message: 'No se encontró suscripción activa para esta empresa.',
      });
    }

    // Bloquear planes con pago vencido o cancelado
    if (['past_due', 'cancelled'].includes(subscription.stripeStatus)) {
      return res.status(403).json({
        error: 'SUBSCRIPTION_INACTIVE',
        stripeStatus: subscription.stripeStatus,
        portalUrl: `${process.env.FRONTEND_URL}/billing`,
        message: 'Tu suscripción está inactiva. Actualiza tu método de pago para continuar.',
      });
    }

    const plan = subscription.plan;
    const limites = TIER_LIMITS[plan];

    // Enterprise sin límite — pasa directo
    if (limites.clasificacionesMes === Infinity) {
      req.tierInfo = { plan, limites, subscription };
      return next();
    }

    // Calcular rango del mes en curso
    const ahora = new Date();
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    const inicioMesSiguiente = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 1);

    // Criterio de conteo: por usuario (Free/Pro) o por empresa (Team/Enterprise)
    const whereClasificaciones = {
      createdAt: { [Op.gte]: inicioMes, [Op.lt]: inicioMesSiguiente },
      ...(limites.countByUser ? { userId } : { companyId }),
    };

    const usado = await Classifications.count({ where: whereClasificaciones });

    if (usado >= limites.clasificacionesMes) {
      // resetDate: primer día del mes siguiente
      const resetDate = inicioMesSiguiente.toISOString().split('T')[0];

      return res.status(429).json({
        error: 'PLAN_LIMIT_EXCEEDED',
        currentPlan: plan,
        limit: limites.clasificacionesMes,
        used: usado,
        resetDate,
        upgradeUrl: '/pricing',
        message: `Has alcanzado el límite de ${limites.clasificacionesMes} clasificaciones del plan ${plan}.`,
      });
    }

    // Inyectar información de tier en el request para uso en controllers
    req.tierInfo = { plan, limites, subscription, usadoMes: usado };
    next();
  } catch (error) {
    console.error('[planLimiter]', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error interno del servidor.' });
  }
};

module.exports = planLimiter;
