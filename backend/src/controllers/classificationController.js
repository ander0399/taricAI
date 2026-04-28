const classificationService = require('../services/classificationService');
const { Company } = require('../models');

/**
 * @description Registra una clasificación arancelaria. El tierGuard ya validó el límite mensual
 * antes de llegar aquí — req.tierInfo contiene plan y uso actual.
 * @param {import('express').Request} req - Body: { descripcionProducto, jurisdiccion?, codigoArancelario?, scoreConfianza?, metadata? }
 * @param {import('express').Response} res
 */
const createClassification = async (req, res) => {
  try {
    const { descripcionProducto, jurisdiccion, codigoArancelario, scoreConfianza, metadata } = req.body;

    if (!descripcionProducto) {
      return res.status(400).json({ success: false, message: 'El campo descripcionProducto es requerido.' });
    }

    const clasificacion = await classificationService.crearClasificacion({
      userId: req.user.userId,
      companyId: req.user.companyId,
      plan: req.tierInfo.plan,
      descripcionProducto,
      jurisdiccion,
      codigoArancelario,
      scoreConfianza,
      metadata,
    });

    return res.status(201).json({
      success: true,
      message: 'Clasificación registrada.',
      data: clasificacion,
      uso: {
        usado: req.tierInfo.usadoMes + 1,
        limite: req.tierInfo.limites.clasificacionesMes,
        plan: req.tierInfo.plan,
      },
    });
  } catch (error) {
    if (error.message === 'JURISDICTION_NOT_ALLOWED') {
      return res.status(403).json({
        success: false,
        message: `La jurisdicción solicitada no está disponible en tu plan ${req.tierInfo?.plan}. Actualiza tu suscripción.`,
      });
    }
    console.error('[createClassification]', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
};

/**
 * @description Lista clasificaciones de la empresa con paginación.
 * Un 'member' solo ve las suyas; owner y admin ven todas.
 * @param {import('express').Request} req - Query: { page?, limit?, soloMias? }
 * @param {import('express').Response} res
 */
const getClassifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);

    // Members solo ven sus propias clasificaciones
    const userId =
      req.user.role === 'member' || req.query.soloMias === 'true'
        ? req.user.userId
        : null;

    const resultado = await classificationService.listarClasificaciones({
      companyId: req.user.companyId,
      userId,
      page,
      limit,
    });

    return res.status(200).json({ success: true, data: resultado });
  } catch (error) {
    console.error('[getClassifications]', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
};

/**
 * @description Retorna el resumen de uso del mes para mostrar en el dashboard.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const getUsageSummary = async (req, res) => {
  try {
    const company = await Company.findByPk(req.user.companyId);
    const resumen = await classificationService.obtenerResumenUso({
      companyId: req.user.companyId,
      plan: company.plan,
    });
    return res.status(200).json({ success: true, data: resumen });
  } catch (error) {
    console.error('[getUsageSummary]', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
};

module.exports = { createClassification, getClassifications, getUsageSummary };
