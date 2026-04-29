const { Classifications } = require('../../src/models');
const { CLASSIFICATIONS } = require('../data/classifications.data');

/**
 * @description Inserta 152 clasificaciones arancelarias de prueba.
 * Distribución: Andina=5 · GlobalTrade=12 · ComerExport=45 · Adriatica=10 · Nexus=80.
 * Las clasificaciones de Adriatica tienen createdAt anterior al vencimiento del plan.
 *
 * @param {import('sequelize').Transaction} t
 * @returns {Promise<void>}
 */
async function seedClassifications(t) {
  await Classifications.bulkCreate(CLASSIFICATIONS, {
    transaction: t,
    updateOnDuplicate: [
      'inputType', 'inputData', 'hsCode', 'hsCodeOrigin', 'hsCodeDest',
      'originCountry', 'destCountry', 'resultJson', 'confidence',
      'mirrorAnalysis', 'status', 'updatedAt',
    ],
  });
  console.log(`  ✓ Classifications: ${CLASSIFICATIONS.length} registros insertados`);
}

module.exports = { seedClassifications };
