const { Op } = require('sequelize');
const { Classifications, Company } = require('../models');
const TIER_LIMITS = require('../config/tiers');

/**
 * @description Middleware que valida el límite de clasificaciones/mes del tier activo.
 * Cuenta las clasificaciones del mes en curso para la empresa y bloquea si se alcanzó el tope.
 * Debe usarse DESPUÉS de authenticate.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const tierGuard = async (req, res, next) => {
  try {
    const company = await Company.findByPk(req.user.companyId);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Empresa no encontrada.' });
    }

    const limites = TIER_LIMITS[company.plan];

    // Rango del mes en curso (primer día 00:00:00 → último día 23:59:59)
    const ahora = new Date();
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    const finMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59, 999);

    const totalMes = await Classifications.count({
      where: {
        companyId: req.user.companyId,
        createdAt: { [Op.between]: [inicioMes, finMes] },
      },
    });

    if (totalMes >= limites.clasificacionesMes) {
      return res.status(403).json({
        success: false,
        code: 'TIER_CLASSIFICATION_LIMIT_REACHED',
        message: `Has alcanzado el límite de ${limites.clasificacionesMes} clasificaciones/mes del plan ${company.plan}. Actualiza tu suscripción para continuar.`,
        data: { usado: totalMes, limite: limites.clasificacionesMes, plan: company.plan },
      });
    }

    // Inyectar datos de tier para uso en el controlador
    req.tierInfo = { plan: company.plan, limites, usadoMes: totalMes };
    next();
  } catch (error) {
    console.error('[tierGuard]', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
};

module.exports = tierGuard;
