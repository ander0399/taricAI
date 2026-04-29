require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const { sequelize } = require('../../src/models');
const { seedCompanies }              = require('./01_seed_companies');
const { seedUsers }                  = require('./02_seed_users');
const { seedSubscriptions }          = require('./03_seed_subscriptions');
const { seedTeams }                  = require('./04_seed_teams');
const { seedClassifications }        = require('./05_seed_classifications');
const { seedClassificationSources }  = require('./06_seed_classification_sources');
const { seedChat }                   = require('./07_seed_chat');

const {
  Company, User, Team, UserTeams,
  Subscription, Classifications, ClassificationSources,
  ChatConversations, ChatMessages,
} = require('../../src/models');

const { COMPANY_IDS } = require('../helpers/uuid.helper');

/**
 * @description Elimina todos los datos del seed en orden inverso a las FK.
 * Usa los UUIDs fijos de COMPANY_IDS para identificar exactamente los registros.
 * Envuelto en transacción — rollback si falla cualquier paso.
 *
 * @param {import('sequelize').Transaction} t
 * @returns {Promise<void>}
 */
async function cleanSeed(t) {
  const companyIds = Object.values(COMPANY_IDS);

  // 1. ChatMessages (FK → ChatConversations)
  const convs = await ChatConversations.findAll({
    where: { companyId: companyIds },
    attributes: ['id'],
    transaction: t,
  });
  const convIds = convs.map((c) => c.id);
  if (convIds.length) {
    await ChatMessages.destroy({ where: { conversationId: convIds }, transaction: t });
  }

  // 2. ChatConversations
  await ChatConversations.destroy({ where: { companyId: companyIds }, transaction: t });

  // 3. ClassificationSources (FK CASCADE desde Classifications)
  const classifs = await Classifications.findAll({
    where: { companyId: companyIds },
    attributes: ['id'],
    transaction: t,
  });
  const classifIds = classifs.map((c) => c.id);
  if (classifIds.length) {
    await ClassificationSources.destroy({ where: { classificationId: classifIds }, transaction: t });
  }

  // 4. Classifications
  await Classifications.destroy({ where: { companyId: companyIds }, transaction: t });

  // 5. UserTeams (FK → User + Team)
  const teams = await Team.findAll({
    where: { companyId: companyIds },
    attributes: ['id'],
    transaction: t,
  });
  const teamIds = teams.map((tm) => tm.id);
  if (teamIds.length) {
    await UserTeams.destroy({ where: { teamId: teamIds }, transaction: t });
  }

  // 6. Teams
  await Team.destroy({ where: { companyId: companyIds }, transaction: t });

  // 7. Subscriptions
  await Subscription.destroy({ where: { companyId: companyIds }, transaction: t });

  // 8. Limpiar propietarioId antes de borrar users (FK circular)
  await Company.update({ propietarioId: null }, { where: { id: companyIds }, transaction: t });

  // 9. Users
  await User.destroy({ where: { companyId: companyIds }, transaction: t });

  // 10. Companies
  await Company.destroy({ where: { id: companyIds }, transaction: t });

  console.log('  ✓ Seed eliminado correctamente');
}

/**
 * @description Ejecuta el seed dentro de una transacción, sin cerrar la conexión.
 * Llamado desde server.js (SEED_ON_START=true) o desde run() en CLI.
 *
 * @param {boolean} isClean - true para eliminar datos en lugar de insertar
 * @returns {Promise<void>}
 */
async function runSeed(isClean = false) {
  const t = await sequelize.transaction();
  try {
    if (isClean) {
      console.log('\n⚠️  Eliminando datos de prueba...');
      await cleanSeed(t);
    } else {
      console.log('\n📦 Insertando datos de prueba...\n');
      await seedCompanies(t);
      await seedUsers(t);
      await seedSubscriptions(t);
      await seedTeams(t);
      await seedClassifications(t);
      await seedClassificationSources(t);
      await seedChat(t);
    }

    await t.commit();
    console.log(isClean
      ? '\n✅ --clean completado. Base de datos sin datos de prueba.\n'
      : '\n✅ Seed completado. 5 empresas · 20 usuarios · 152 clasificaciones · 7 chats.\n'
    );
  } catch (err) {
    await t.rollback();
    console.error('\n❌ Seed falló — rollback completo:', err.message);
    throw err;
  }
}

/**
 * @description CLI wrapper. Autentica, corre el seed y cierra la conexión.
 *
 * USO:
 *   node usuariosPrueba/seeders/index.js          ← insertar datos
 *   node usuariosPrueba/seeders/index.js --clean  ← eliminar datos
 */
async function run() {
  const isClean = process.argv.includes('--clean');
  try {
    await sequelize.authenticate();
    await runSeed(isClean);
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

if (require.main === module) {
  run();
}

module.exports = { runSeed };
