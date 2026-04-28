const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * @description Mensaje individual dentro de una conversación de Chat de IA.
 * Inmutable una vez creado — sin updatedAt. companyId y userId denormalizados
 * para permitir COUNT de límites sin JOINs.
 */
const ChatMessages = sequelize.define('ChatMessages', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  conversationId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'chat_conversations', key: 'id' },
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    // Denormalizado: necesario para COUNT de límite por userId (Free/Pro)
  },
  companyId: {
    type: DataTypes.UUID,
    allowNull: false,
    // Denormalizado: necesario para COUNT de límite por companyId (Team)
  },
  role: {
    type: DataTypes.ENUM('user', 'assistant'),
    allowNull: false,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  language: {
    type: DataTypes.STRING(10),
    allowNull: true,
    // ISO 639-1 del idioma detectado en este mensaje específico
  },
  queryType: {
    type: DataTypes.ENUM(
      'tariff', 'treaty', 'incoterms', 'logistics', 'geopolitical',
      'market_research', 'customs_procedure', 'regulatory',
      'sanctions', 'valuation', 'negotiation', 'contract', 'legal',
      'transport_law', 'transfer_pricing', 'general', 'out_of_scope'
    ),
    allowNull: true,
    // Clasificado por gpt-4o-mini — usado para selección de fuentes + analíticas
  },
  sourcesUsed: {
    type: DataTypes.JSONB,
    allowNull: true,
    // Array: [{ url, name, country, countryCode, fetchedAt, status }]
  },
  tokensUsed: {
    type: DataTypes.INTEGER,
    allowNull: true,
    // Tokens del completion de OpenAI — solo role='assistant'
  },
  responseTimeMs: {
    type: DataTypes.INTEGER,
    allowNull: true,
    // Latencia total en ms — para monitoreo de rendimiento en producción
  },
}, {
  tableName: 'chat_messages',
  // Sin updatedAt — los mensajes son inmutables una vez creados
  createdAt: true,
  updatedAt: false,
  indexes: [
    { fields: ['conversationId', 'createdAt'] },
    { fields: ['userId', 'role', 'createdAt'] },
    { fields: ['companyId', 'role', 'createdAt'] },
  ],
});

module.exports = ChatMessages;
