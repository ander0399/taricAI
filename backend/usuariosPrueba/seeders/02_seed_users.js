const { User, Company } = require('../../src/models');
const { USERS } = require('../data/users.data');
const { hashPassword } = require('../helpers/hash.helper');

/**
 * @description Inserta los 20 usuarios de prueba.
 * Hashea las contraseñas en texto claro antes de insertar.
 * Tras insertar, actualiza propietarioId en cada Company (FK circular resuelta).
 *
 * @param {import('sequelize').Transaction} t
 * @returns {Promise<void>}
 */
async function seedUsers(t) {
  const hashed = await Promise.all(
    USERS.map(async (u) => ({
      ...u,
      password: await hashPassword(u.password),
    }))
  );

  await User.bulkCreate(hashed, {
    transaction: t,
    updateOnDuplicate: ['nombre', 'email', 'password', 'role', 'activo', 'updatedAt'],
  });
  console.log(`  ✓ Users: ${hashed.length} registros insertados`);

  // Actualizar propietarioId en cada Company ahora que los owners existen
  const owners = USERS.filter((u) => u.role === 'owner');
  await Promise.all(
    owners.map((owner) =>
      Company.update(
        { propietarioId: owner.id },
        { where: { id: owner.companyId }, transaction: t }
      )
    )
  );
  console.log(`  ✓ Companies: propietarioId actualizado para ${owners.length} empresas`);
}

module.exports = { seedUsers };
