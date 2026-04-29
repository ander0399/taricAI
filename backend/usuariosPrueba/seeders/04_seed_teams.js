const { Team, UserTeams } = require('../../src/models');
const { TEAMS, USER_TEAMS } = require('../data/teams.data');

/**
 * @description Inserta 6 equipos y 23 membresías M:N (UserTeams).
 * Solo planes Team y Enterprise tienen equipos.
 *
 * @param {import('sequelize').Transaction} t
 * @returns {Promise<void>}
 */
async function seedTeams(t) {
  await Team.bulkCreate(TEAMS, {
    transaction: t,
    updateOnDuplicate: ['nombre', 'updatedAt'],
  });
  console.log(`  ✓ Teams: ${TEAMS.length} registros insertados`);

  await UserTeams.bulkCreate(USER_TEAMS, {
    transaction: t,
    ignoreDuplicates: true,
  });
  console.log(`  ✓ UserTeams: ${USER_TEAMS.length} membresías insertadas`);
}

module.exports = { seedTeams };
