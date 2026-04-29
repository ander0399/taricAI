const { ChatConversations, ChatMessages } = require('../../src/models');
const { CONVERSATIONS, MESSAGES } = require('../data/chat.data');

/**
 * @description Inserta conversaciones y mensajes de chat de prueba.
 * Los modelos ChatConversations y ChatMessages ya existen en el proyecto —
 * no se crean tablas aquí. Solo se hace bulkCreate de los datos de prueba.
 *
 * @param {import('sequelize').Transaction} t
 * @returns {Promise<void>}
 */
async function seedChat(t) {
  await ChatConversations.bulkCreate(CONVERSATIONS, {
    transaction: t,
    updateOnDuplicate: ['title', 'language', 'status', 'messageCount', 'updatedAt'],
  });
  console.log(`  ✓ ChatConversations: ${CONVERSATIONS.length} registros insertados`);

  // ChatMessages no tiene updatedAt (modelo inmutable) — usar ignoreDuplicates
  await ChatMessages.bulkCreate(MESSAGES, {
    transaction: t,
    ignoreDuplicates: true,
  });
  console.log(`  ✓ ChatMessages: ${MESSAGES.length} registros insertados`);
}

module.exports = { seedChat };
