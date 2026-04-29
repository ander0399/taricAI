/**
 * @description UUIDs fijos y predecibles para el seed de datos de prueba.
 * Usar UUIDs fijos (no generados en runtime) garantiza que:
 *   1. El seed es idempotente — se puede ejecutar múltiples veces sin duplicados
 *   2. Las relaciones FK son consistentes entre ejecuciones
 *   3. El flag --clean puede identificar y eliminar exactamente estos registros
 *
 * Prefijos por entidad:
 *   c = Company  |  a = User  |  d = Team
 *   b = Subscription  |  f = Classification  |  e = ChatConversation
 *
 * Segundo dígito = empresa: 1=Andina, 2=GlobalTrade, 3=ComerExport, 4=Adriatica, 5=Nexus
 */

const COMPANY_IDS = {
  andina:      'c1000000-0000-0000-0000-000000000001',
  globaltrade: 'c2000000-0000-0000-0000-000000000002',
  comerexport: 'c3000000-0000-0000-0000-000000000003',
  adriatica:   'c4000000-0000-0000-0000-000000000004',
  nexus:       'c5000000-0000-0000-0000-000000000005',
};

const SUBSCRIPTION_IDS = {
  andina:      'b1000000-0000-0000-0000-000000000001',
  globaltrade: 'b2000000-0000-0000-0000-000000000002',
  comerexport: 'b3000000-0000-0000-0000-000000000003',
  adriatica:   'b4000000-0000-0000-0000-000000000004',
  nexus:       'b5000000-0000-0000-0000-000000000005',
};

const USER_IDS = {
  // Empresa 1 — Logística Andina
  owner_andina:     'a1000000-0000-0000-0000-000000000001',
  // Empresa 2 — GlobalTrade
  owner_globaltrade: 'a2000000-0000-0000-0000-000000000001',
  // Empresa 3 — ComerExport (8 usuarios)
  owner_comer:      'a3000000-0000-0000-0000-000000000001',
  admin_comer_1:    'a3000000-0000-0000-0000-000000000002',
  admin_comer_2:    'a3000000-0000-0000-0000-000000000003',
  member_comer_1:   'a3000000-0000-0000-0000-000000000004',
  member_comer_2:   'a3000000-0000-0000-0000-000000000005',
  member_comer_3:   'a3000000-0000-0000-0000-000000000006',
  member_comer_4:   'a3000000-0000-0000-0000-000000000007',
  member_comer_5:   'a3000000-0000-0000-0000-000000000008',
  // Empresa 4 — Adriatica (4 usuarios)
  owner_adriatica:  'a4000000-0000-0000-0000-000000000001',
  admin_adriatica:  'a4000000-0000-0000-0000-000000000002',
  member_adria_1:   'a4000000-0000-0000-0000-000000000003',
  member_adria_2:   'a4000000-0000-0000-0000-000000000004',
  // Empresa 5 — Nexus (6 usuarios)
  owner_nexus:      'a5000000-0000-0000-0000-000000000001',
  admin_nexus_1:    'a5000000-0000-0000-0000-000000000002',
  admin_nexus_2:    'a5000000-0000-0000-0000-000000000003',
  member_nexus_1:   'a5000000-0000-0000-0000-000000000004',
  member_nexus_2:   'a5000000-0000-0000-0000-000000000005',
  member_nexus_3:   'a5000000-0000-0000-0000-000000000006',
};

const TEAM_IDS = {
  // ComerExport — 3 equipos
  importaciones_america:   'd3000000-0000-0000-0000-000000000001',
  exportaciones_europa:    'd3000000-0000-0000-0000-000000000002',
  regulatorio_asia:        'd3000000-0000-0000-0000-000000000003',
  // Adriatica — 1 equipo
  clasificacion_ue:        'd4000000-0000-0000-0000-000000000001',
  // Nexus — 2 equipos
  global_compliance:       'd5000000-0000-0000-0000-000000000001',
  apac_trade_intelligence: 'd5000000-0000-0000-0000-000000000002',
};

const CONV_IDS = {
  // GlobalTrade (3 conversaciones)
  gt_1: 'e2000000-0000-0000-0000-000000000001',
  gt_2: 'e2000000-0000-0000-0000-000000000002',
  gt_3: 'e2000000-0000-0000-0000-000000000003',
  // ComerExport (5 conversaciones)
  comer_1: 'e3000000-0000-0000-0000-000000000001',
  comer_2: 'e3000000-0000-0000-0000-000000000002',
  comer_3: 'e3000000-0000-0000-0000-000000000003',
  comer_4: 'e3000000-0000-0000-0000-000000000004',
  comer_5: 'e3000000-0000-0000-0000-000000000005',
  // Adriatica (2 conversaciones)
  adria_1: 'e4000000-0000-0000-0000-000000000001',
  adria_2: 'e4000000-0000-0000-0000-000000000002',
  // Nexus (8 conversaciones)
  nexus_1: 'e5000000-0000-0000-0000-000000000001',
  nexus_2: 'e5000000-0000-0000-0000-000000000002',
  nexus_3: 'e5000000-0000-0000-0000-000000000003',
  nexus_4: 'e5000000-0000-0000-0000-000000000004',
  nexus_5: 'e5000000-0000-0000-0000-000000000005',
  nexus_6: 'e5000000-0000-0000-0000-000000000006',
  nexus_7: 'e5000000-0000-0000-0000-000000000007',
  nexus_8: 'e5000000-0000-0000-0000-000000000008',
};

/**
 * @description Genera un UUID v4 simple para mensajes de chat (no necesitan ser fijos).
 * @returns {string}
 */
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

module.exports = { COMPANY_IDS, SUBSCRIPTION_IDS, USER_IDS, TEAM_IDS, CONV_IDS, uuidv4 };
