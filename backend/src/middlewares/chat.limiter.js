const { Op } = require('sequelize');
const { ChatMessages, Subscription } = require('../models');

const CHAT_LIMIT_FREE = parseInt(process.env.CHAT_LIMIT_FREE, 10) || 20;
const CHAT_LIMIT_PRO  = parseInt(process.env.CHAT_LIMIT_PRO, 10)  || 200;
const CHAT_LIMIT_TEAM = 2000;

/**
 * @description Middleware que valida el límite mensual de consultas del Chat de IA por plan.
 * Completamente independiente de plan.limiter.js (clasificador arancelario) — contadores separados.
 * Orden: authenticate → chatLimiter → controller.
 *
 * - Free: 20 consultas/mes por userId
 * - Pro: 200 consultas/mes por userId
 * - Team: 2000 consultas/mes compartidas por companyId
 * - Enterprise: sin límite — early return
 */
const chatLimiter = async (req, res, next) => {
  try {
    const { userId, companyId } = req.user;

    const subscription = await Subscription.findOne({ where: { companyId } });

    if (!subscription) {
      return res.status(403).json({
        error: 'SUBSCRIPTION_NOT_FOUND',
        message: 'No se encontró suscripción activa para esta empresa.',
      });
    }

    if (['past_due', 'cancelled'].includes(subscription.stripeStatus)) {
      return res.status(403).json({
        error: 'SUBSCRIPTION_INACTIVE',
        stripeStatus: subscription.stripeStatus,
        portalUrl: `${process.env.FRONTEND_URL}/billing`,
      });
    }

    const plan = subscription.plan;

    // Enterprise sin límite — pasa directo
    if (plan === 'enterprise') {
      req.chatPlan = { plan, limit: Infinity, subscription };
      return next();
    }

    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    // Team cuenta por empresa; Free/Pro cuentan por usuario
    const whereCount = {
      role: 'user',
      createdAt: { [Op.gte]: startOfMonth },
      ...(plan === 'team' ? { companyId } : { userId }),
    };

    const used = await ChatMessages.count({ where: whereCount });

    const limit = plan === 'free' ? CHAT_LIMIT_FREE
                : plan === 'pro'  ? CHAT_LIMIT_PRO
                : CHAT_LIMIT_TEAM;

    if (used >= limit) {
      const now = new Date();
      const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

      return res.status(429).json({
        error: 'CHAT_LIMIT_EXCEEDED',
        currentPlan: plan,
        limit,
        used,
        resetDate,
        upgradeUrl: '/pricing',
      });
    }

    req.chatPlan = { plan, limit, used, subscription };
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = chatLimiter;
