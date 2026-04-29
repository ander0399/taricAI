const { Company } = require('../../src/models');
const { COMPANIES } = require('../data/companies.data');

/**
 * @description Inserta las 5 empresas de prueba con UUIDs fijos.
 * propietarioId se inserta NULL primero (FK circular con User) y se
 * actualiza en 02_seed_users.js después de crear los owners.
 *
 * @param {import('sequelize').Transaction} t
 * @returns {Promise<void>}
 */
async function seedCompanies(t) {
  const rows = COMPANIES.map((c) => ({ ...c, propietarioId: null }));
  await Company.bulkCreate(rows, {
    transaction: t,
    updateOnDuplicate: ['nombre', 'plan', 'stripeCustomerId', 'stripeSubscriptionId', 'updatedAt'],
  });
  console.log(`  ✓ Companies: ${rows.length} registros insertados`);
}

module.exports = { seedCompanies };
