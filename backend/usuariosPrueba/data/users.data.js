const { USER_IDS, COMPANY_IDS } = require('../helpers/uuid.helper');

/**
 * @description Datos de los 20 usuarios de prueba en texto claro.
 * Las contraseñas son hasheadas por 02_seed_users.js antes de insertarse en DB.
 * NUNCA usar estas contraseñas en producción.
 *
 * Campo 'password' aquí = texto claro → el seeder lo convierte a hash bcrypt.
 * Campo 'activo' corresponde al campo User.activo del modelo real.
 */
const USERS = [
  // ─── Empresa 1: Logística Andina S.A.S (Free) ────────────────────────────
  {
    id: USER_IDS.owner_andina,
    nombre: 'Carlos Méndez',
    email: 'carlos.mendez@logisticaandina.co',
    password: 'Andina2024!',
    role: 'owner',
    companyId: COMPANY_IDS.andina,
    activo: true,
  },

  // ─── Empresa 2: GlobalTrade Solutions (Pro) ──────────────────────────────
  {
    id: USER_IDS.owner_globaltrade,
    nombre: 'Sofía Ramírez',
    email: 'sofia.ramirez@globaltradesolutions.com',
    password: 'GlobalTrade2024!',
    role: 'owner',
    companyId: COMPANY_IDS.globaltrade,
    activo: true,
  },

  // ─── Empresa 3: ComerExport Group (Team activo — 8 usuarios) ─────────────
  {
    id: USER_IDS.owner_comer,
    nombre: 'Ana Torres',
    email: 'ana.torres@comerexportgroup.com',
    password: 'ComerOwner2024!',
    role: 'owner',
    companyId: COMPANY_IDS.comerexport,
    activo: true,
  },
  {
    id: USER_IDS.admin_comer_1,
    nombre: 'Luis García',
    email: 'luis.garcia@comerexportgroup.com',
    password: 'ComerAdmin1_2024!',
    role: 'admin',
    companyId: COMPANY_IDS.comerexport,
    activo: true,
  },
  {
    id: USER_IDS.admin_comer_2,
    nombre: 'Paula Ríos',
    email: 'paula.rios@comerexportgroup.com',
    password: 'ComerAdmin2_2024!',
    role: 'admin',
    companyId: COMPANY_IDS.comerexport,
    activo: true,
  },
  {
    id: USER_IDS.member_comer_1,
    nombre: 'Jorge Vega',
    email: 'jorge.vega@comerexportgroup.com',
    password: 'ComerMember1_2024!',
    role: 'member',
    companyId: COMPANY_IDS.comerexport,
    activo: true,
  },
  {
    id: USER_IDS.member_comer_2,
    nombre: 'Diana Mora',
    email: 'diana.mora@comerexportgroup.com',
    password: 'ComerMember2_2024!',
    role: 'member',
    companyId: COMPANY_IDS.comerexport,
    activo: true,
  },
  {
    id: USER_IDS.member_comer_3,
    nombre: 'Pablo León',
    email: 'pablo.leon@comerexportgroup.com',
    password: 'ComerMember3_2024!',
    role: 'member',
    companyId: COMPANY_IDS.comerexport,
    activo: true,
  },
  {
    id: USER_IDS.member_comer_4,
    nombre: 'Lucía Campos',
    email: 'lucia.campos@comerexportgroup.com',
    password: 'ComerMember4_2024!',
    role: 'member',
    companyId: COMPANY_IDS.comerexport,
    activo: true,
  },
  {
    id: USER_IDS.member_comer_5,
    nombre: 'Tomás Ibarra',
    email: 'tomas.ibarra@comerexportgroup.com',
    password: 'ComerMember5_2024!',
    role: 'member',
    companyId: COMPANY_IDS.comerexport,
    activo: true,
  },

  // ─── Empresa 4: Adriatica Imports EU (Team past_due — 4 usuarios) ─────────
  {
    id: USER_IDS.owner_adriatica,
    nombre: 'Marco Rossi',
    email: 'marco.rossi@adriatica-eu.com',
    password: 'AdriaticaOwner2024!',
    role: 'owner',
    companyId: COMPANY_IDS.adriatica,
    activo: true,
  },
  {
    id: USER_IDS.admin_adriatica,
    nombre: 'Elena Bauer',
    email: 'elena.bauer@adriatica-eu.com',
    password: 'AdriaticaAdmin2024!',
    role: 'admin',
    companyId: COMPANY_IDS.adriatica,
    activo: true,
  },
  {
    id: USER_IDS.member_adria_1,
    nombre: 'Jan Kovač',
    email: 'jan.kovac@adriatica-eu.com',
    password: 'AdriaticaMember1_2024!',
    role: 'member',
    companyId: COMPANY_IDS.adriatica,
    activo: true,
  },
  {
    id: USER_IDS.member_adria_2,
    nombre: 'Anna Patel',
    email: 'anna.patel@adriatica-eu.com',
    password: 'AdriaticaMember2_2024!',
    role: 'member',
    companyId: COMPANY_IDS.adriatica,
    activo: true,
  },

  // ─── Empresa 5: Nexus Enterprise Corp (Enterprise — 6 usuarios) ──────────
  {
    id: USER_IDS.owner_nexus,
    nombre: 'Victoria Chen',
    email: 'victoria.chen@nexusenterprise.com',
    password: 'NexusOwner2024!',
    role: 'owner',
    companyId: COMPANY_IDS.nexus,
    activo: true,
  },
  {
    id: USER_IDS.admin_nexus_1,
    nombre: 'Rafael Ortiz',
    email: 'rafael.ortiz@nexusenterprise.com',
    password: 'NexusAdmin1_2024!',
    role: 'admin',
    companyId: COMPANY_IDS.nexus,
    activo: true,
  },
  {
    id: USER_IDS.admin_nexus_2,
    nombre: 'Yuki Tanaka',
    email: 'yuki.tanaka@nexusenterprise.com',
    password: 'NexusAdmin2_2024!',
    role: 'admin',
    companyId: COMPANY_IDS.nexus,
    activo: true,
  },
  {
    id: USER_IDS.member_nexus_1,
    nombre: 'Priya Sharma',
    email: 'priya.sharma@nexusenterprise.com',
    password: 'NexusMember1_2024!',
    role: 'member',
    companyId: COMPANY_IDS.nexus,
    activo: true,
  },
  {
    id: USER_IDS.member_nexus_2,
    nombre: 'David Okonkwo',
    email: 'david.okonkwo@nexusenterprise.com',
    password: 'NexusMember2_2024!',
    role: 'member',
    companyId: COMPANY_IDS.nexus,
    activo: true,
  },
  {
    id: USER_IDS.member_nexus_3,
    nombre: 'Isabelle Dupont',
    email: 'isabelle.dupont@nexusenterprise.com',
    password: 'NexusMember3_2024!',
    role: 'member',
    companyId: COMPANY_IDS.nexus,
    activo: true,
  },
];

module.exports = { USERS };
