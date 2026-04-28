const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const { Classifications, User } = require('../models');
const TIER_LIMITS = require('../config/tiers');

/**
 * @description Registra una nueva clasificación arancelaria para el usuario/empresa.
 * Valida que la jurisdicción solicitada esté incluida en el plan activo.
 * @param {{ userId: string, companyId: string, plan: string, descripcionProducto: string, jurisdiccion: string, codigoArancelario?: string, scoreConfianza?: number, metadata?: object }} datos
 * @returns {Promise<object>} Clasificación creada
 */
const crearClasificacion = async ({
  userId,
  companyId,
  plan,
  descripcionProducto,
  jurisdiccion,
  codigoArancelario = null,
  scoreConfianza = null,
  metadata = null,
}) => {
  const limites = TIER_LIMITS[plan];

  if (jurisdiccion && !limites.jurisdicciones.includes(jurisdiccion)) {
    throw new Error('JURISDICTION_NOT_ALLOWED');
  }

  // scoreConfianza solo disponible en planes con scoring
  const scoreFinal = limites.scoring ? scoreConfianza : null;

  const clasificacion = await Classifications.create({
    id: uuidv4(),
    userId,
    companyId,
    descripcionProducto,
    codigoArancelario,
    scoreConfianza: scoreFinal,
    jurisdiccion: jurisdiccion || limites.jurisdicciones[0],
    metadata,
  });

  return clasificacion.toJSON();
};

/**
 * @description Retorna el historial de clasificaciones de la empresa con paginación.
 * Opcionalmente filtrado por userId para ver solo las clasificaciones del usuario en sesión.
 * @param {{ companyId: string, userId?: string, page: number, limit: number }} datos
 * @returns {Promise<{ rows: object[], count: number, totalPages: number }>}
 */
const listarClasificaciones = async ({ companyId, userId = null, page = 1, limit = 20 }) => {
  const where = { companyId };
  if (userId) where.userId = userId;

  const offset = (page - 1) * limit;

  const { rows, count } = await Classifications.findAndCountAll({
    where,
    include: [{ association: 'usuario', attributes: ['id', 'nombre', 'email'] }],
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });

  return {
    rows: rows.map((c) => c.toJSON()),
    count,
    totalPages: Math.ceil(count / limit),
    page,
  };
};

/**
 * @description Retorna el resumen de uso del mes en curso para la empresa.
 * Útil para mostrar el indicador de consumo en el dashboard.
 * @param {{ companyId: string, plan: string }} datos
 * @returns {Promise<{ usado: number, limite: number, porcentaje: number, plan: string }>}
 */
const obtenerResumenUso = async ({ companyId, plan }) => {
  const ahora = new Date();
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  const finMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59, 999);

  const usado = await Classifications.count({
    where: { companyId, createdAt: { [Op.between]: [inicioMes, finMes] } },
  });

  const limite = TIER_LIMITS[plan].clasificacionesMes;

  return {
    usado,
    limite,
    porcentaje: Math.round((usado / limite) * 100),
    plan,
    mes: `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}`,
  };
};

module.exports = { crearClasificacion, listarClasificaciones, obtenerResumenUso };
