const { TEAM_IDS, USER_IDS, COMPANY_IDS } = require('../helpers/uuid.helper');

/**
 * @description Equipos y membresías de prueba.
 * Solo planes Team y Enterprise tienen equipos.
 * El owner aparece en múltiples equipos de su empresa — comportamiento válido.
 */
const TEAMS = [
  // ─── ComerExport Group — 3 equipos ───────────────────────────────────────
  {
    id: TEAM_IDS.importaciones_america,
    nombre: 'Importaciones América',
    companyId: COMPANY_IDS.comerexport,
  },
  {
    id: TEAM_IDS.exportaciones_europa,
    nombre: 'Exportaciones Europa',
    companyId: COMPANY_IDS.comerexport,
  },
  {
    id: TEAM_IDS.regulatorio_asia,
    nombre: 'Regulatorio Asia-Pacífico',
    companyId: COMPANY_IDS.comerexport,
  },

  // ─── Adriatica Imports EU — 1 equipo ─────────────────────────────────────
  {
    id: TEAM_IDS.clasificacion_ue,
    nombre: 'Clasificación UE',
    companyId: COMPANY_IDS.adriatica,
  },

  // ─── Nexus Enterprise Corp — 2 equipos ───────────────────────────────────
  {
    id: TEAM_IDS.global_compliance,
    nombre: 'Global Compliance',
    companyId: COMPANY_IDS.nexus,
  },
  {
    id: TEAM_IDS.apac_trade_intelligence,
    nombre: 'APAC Trade Intelligence',
    companyId: COMPANY_IDS.nexus,
  },
];

/**
 * @description Membresías M:N entre usuarios y equipos.
 * El owner de ComerExport pertenece a los 3 equipos — patrón válido según spec.
 * Todos los usuarios de Adriatica pertenecen al único equipo de la empresa.
 */
const USER_TEAMS = [
  // ─── Importaciones América ────────────────────────────────────────────────
  { userId: USER_IDS.owner_comer,    teamId: TEAM_IDS.importaciones_america },
  { userId: USER_IDS.admin_comer_1,  teamId: TEAM_IDS.importaciones_america },
  { userId: USER_IDS.member_comer_1, teamId: TEAM_IDS.importaciones_america },
  { userId: USER_IDS.member_comer_2, teamId: TEAM_IDS.importaciones_america },

  // ─── Exportaciones Europa ─────────────────────────────────────────────────
  { userId: USER_IDS.owner_comer,    teamId: TEAM_IDS.exportaciones_europa },
  { userId: USER_IDS.admin_comer_2,  teamId: TEAM_IDS.exportaciones_europa },
  { userId: USER_IDS.member_comer_3, teamId: TEAM_IDS.exportaciones_europa },
  { userId: USER_IDS.member_comer_4, teamId: TEAM_IDS.exportaciones_europa },

  // ─── Regulatorio Asia-Pacífico ────────────────────────────────────────────
  { userId: USER_IDS.owner_comer,    teamId: TEAM_IDS.regulatorio_asia },
  { userId: USER_IDS.admin_comer_1,  teamId: TEAM_IDS.regulatorio_asia },
  { userId: USER_IDS.member_comer_5, teamId: TEAM_IDS.regulatorio_asia },

  // ─── Clasificación UE (todos los 4 usuarios de Adriatica) ─────────────────
  { userId: USER_IDS.owner_adriatica,  teamId: TEAM_IDS.clasificacion_ue },
  { userId: USER_IDS.admin_adriatica,  teamId: TEAM_IDS.clasificacion_ue },
  { userId: USER_IDS.member_adria_1,   teamId: TEAM_IDS.clasificacion_ue },
  { userId: USER_IDS.member_adria_2,   teamId: TEAM_IDS.clasificacion_ue },

  // ─── Global Compliance ────────────────────────────────────────────────────
  { userId: USER_IDS.owner_nexus,    teamId: TEAM_IDS.global_compliance },
  { userId: USER_IDS.admin_nexus_1,  teamId: TEAM_IDS.global_compliance },
  { userId: USER_IDS.member_nexus_1, teamId: TEAM_IDS.global_compliance },
  { userId: USER_IDS.member_nexus_2, teamId: TEAM_IDS.global_compliance },

  // ─── APAC Trade Intelligence ──────────────────────────────────────────────
  { userId: USER_IDS.owner_nexus,    teamId: TEAM_IDS.apac_trade_intelligence },
  { userId: USER_IDS.admin_nexus_2,  teamId: TEAM_IDS.apac_trade_intelligence },
  { userId: USER_IDS.member_nexus_3, teamId: TEAM_IDS.apac_trade_intelligence },
];

module.exports = { TEAMS, USER_TEAMS };
