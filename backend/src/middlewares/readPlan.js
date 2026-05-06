const { Company } = require('../models');

/**
 * @description Middleware ligero que lee el plan activo de la empresa y lo adjunta
 * a req.tierInfo para que requirePlan() pueda verificar acceso a features.
 *
 * Diferencia con planLimiter: este middleware NO cuenta uso de clasificaciones.
 * Usar en módulos que tienen gate de plan pero no consumen cuota (ej: Mapa de Riesgo).
 * Orden: authenticate → readPlan → requirePlan('pro') → controller
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const readPlan = async (req, res, next) => {
  try {
    const company = await Company.findByPk(req.user.companyId, {
      attributes: ['plan'],
    });

    req.tierInfo = { plan: company?.plan || 'free' };
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = readPlan;
