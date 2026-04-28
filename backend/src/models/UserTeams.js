const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * @description Tabla pivote M:N entre User y Team.
 * Permite que un usuario pertenezca a múltiples equipos dentro de su empresa.
 */
const UserTeams = sequelize.define('UserTeams', {
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  teamId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
}, {
  tableName: 'user_teams',
  timestamps: false,
});

module.exports = UserTeams;
