const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * @description Conversación de Chat de IA. Una conversación agrupa todos los mensajes
 * de un intercambio continuo. Denormaliza companyId para aislar tenant sin JOINs costosos.
 * Los mensajes se archivan (soft delete) — nunca se eliminan físicamente.
 */
const ChatConversations = sequelize.define('ChatConversations', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'users', key: 'id' },
  },
  companyId: {
    type: DataTypes.UUID,
    allowNull: false,
    // Denormalizado para aislar tenant sin JOIN en queries críticas
    references: { model: 'companies', key: 'id' },
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: true,
    // Auto-generado del primer mensaje. NULL hasta que el primer intercambio se completa.
  },
  language: {
    type: DataTypes.STRING(10),
    allowNull: true,
    // ISO 639-1 detectado en el primer mensaje. Se establece una vez y no cambia.
  },
  status: {
    type: DataTypes.ENUM('active', 'archived'),
    defaultValue: 'active',
    allowNull: false,
    // 'archived' = soft delete — NUNCA eliminar físicamente
  },
  messageCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    // Desnormalizado para evitar COUNT(*) en listados paginados
  },
}, {
  tableName: 'chat_conversations',
  timestamps: true,
  indexes: [
    { fields: ['userId', 'status'] },
    { fields: ['companyId', 'status'] },
  ],
});

module.exports = ChatConversations;
