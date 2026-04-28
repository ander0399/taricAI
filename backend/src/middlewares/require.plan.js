/**
 * @description Factory que genera un middleware guard para features exclusivas de ciertos planes.
 * Debe ejecutarse DESPUÉS de planLimiter (que ya popula req.tierInfo).
 * Orden: verifyJWT → planLimiter → requirePlan('pro') → controller.
 *
 * @param {...string} allowedPlans - Planes que tienen acceso al feature (ej: 'pro', 'team', 'enterprise')
 * @returns {import('express').RequestHandler}
 *
 * @example
 * // Solo Pro, Team y Enterprise pueden acceder al OCR
 * router.post('/ocr', verifyJWT, planLimiter, requirePlan('pro', 'team', 'enterprise'), ocrHandler);
 */
const requirePlan = (...allowedPlans) => (req, res, next) => {
  const currentPlan = req.tierInfo?.plan;

  if (!currentPlan) {
    return res.status(403).json({
      error: 'TIER_INFO_MISSING',
      message: 'planLimiter debe ejecutarse antes de requirePlan.',
    });
  }

  if (!allowedPlans.includes(currentPlan)) {
    return res.status(403).json({
      error: 'PLAN_FEATURE_NOT_AVAILABLE',
      currentPlan,
      requiredPlans: allowedPlans,
      upgradeUrl: '/pricing',
      message: `Esta funcionalidad requiere uno de los planes: ${allowedPlans.join(', ')}.`,
    });
  }

  next();
};

module.exports = requirePlan;
