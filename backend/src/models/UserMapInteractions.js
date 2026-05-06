const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * @description Analytics de interacciones intencionales del usuario con el mapa de riesgo.
 * Solo se registran acciones deliberadas (click, filter, export, pin).
 * hover fue excluido del ENUM — demasiado frecuente, contamina analytics sin valor real.
 *
 * Siempre incluye companyId para garantizar aislamiento multi-tenant en todas las queries.
 * Registro inmutable — solo createdAt, nunca updatedAt (datos de analytics).
 */
const UserMapInteractions = sequelize.define('UserMapInteractions', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  /**
   * Obligatorio para aislamiento multi-tenant.
   * Toda query de analytics usa WHERE companyId = req.user.companyId.
   */
  companyId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  isoAlpha3: {
    type: DataTypes.STRING(3),
    allowNull: false,
  },
  actionType: {
    type: DataTypes.ENUM('click', 'filter', 'export', 'pin'),
    allowNull: false,
  },
  // Para agrupar eventos de la misma sesión de navegación
  sessionId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  timestamps: true,
  updatedAt: false, // analytics inmutable — los eventos no se modifican
  indexes: [
    { fields: ['companyId', 'createdAt'] },
    { fields: ['isoAlpha3', 'createdAt'] },
  ],
});

module.exports = UserMapInteractions;
