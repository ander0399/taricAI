const { USER_IDS, COMPANY_IDS, CONV_IDS, uuidv4 } = require('../helpers/uuid.helper');

/**
 * @description Sesiones y mensajes de chat de prueba.
 * Datos mínimos para verificar que el módulo de Chat IA funciona correctamente.
 * messageCount en cada conversación DEBE coincidir con la cantidad real de mensajes.
 */

function msg(conversationId, userId, companyId, role, content, queryType = null) {
  return {
    id: uuidv4(),
    conversationId,
    userId,
    companyId,
    role,
    content,
    language: 'es',
    queryType: role === 'user' ? queryType : null,
    sourcesUsed: null,
    tokensUsed: null,
    responseTimeMs: null,
  };
}

// ─── Conversaciones ───────────────────────────────────────────────────────────

const CONVERSATIONS = [
  // GlobalTrade — 2 sesiones
  {
    id: CONV_IDS.gt_1,
    userId: USER_IDS.owner_globaltrade,
    companyId: COMPANY_IDS.globaltrade,
    title: 'Partida arancelaria tractores agrícolas Colombia',
    language: 'es',
    status: 'active',
    messageCount: 4,
  },
  {
    id: CONV_IDS.gt_2,
    userId: USER_IDS.owner_globaltrade,
    companyId: COMPANY_IDS.globaltrade,
    title: 'Regulaciones exportación cosméticos a Alemania',
    language: 'es',
    status: 'active',
    messageCount: 4,
  },

  // ComerExport — 2 sesiones
  {
    id: CONV_IDS.comer_1,
    userId: USER_IDS.owner_comer,
    companyId: COMPANY_IDS.comerexport,
    title: 'Medidas antidumping acero chino UE y USA',
    language: 'es',
    status: 'active',
    messageCount: 4,
  },
  {
    id: CONV_IDS.comer_2,
    userId: USER_IDS.admin_comer_1,
    companyId: COMPANY_IDS.comerexport,
    title: 'Requisitos COFEPRIS alimentos orgánicos México',
    language: 'es',
    status: 'active',
    messageCount: 4,
  },

  // Adriatica — 1 sesión
  {
    id: CONV_IDS.adria_1,
    userId: USER_IDS.owner_adriatica,
    companyId: COMPANY_IDS.adriatica,
    title: 'Carbon Border Adjustment Mechanism CBAM Europa',
    language: 'es',
    status: 'active',
    messageCount: 4,
  },

  // Nexus — 2 sesiones
  {
    id: CONV_IDS.nexus_1,
    userId: USER_IDS.owner_nexus,
    companyId: COMPANY_IDS.nexus,
    title: 'Estrategia arancelaria expansión ASEAN RCEP',
    language: 'es',
    status: 'active',
    messageCount: 4,
  },
  {
    id: CONV_IDS.nexus_2,
    userId: USER_IDS.admin_nexus_1,
    companyId: COMPANY_IDS.nexus,
    title: 'Dual-use goods controles exportación EAR ITAR',
    language: 'es',
    status: 'active',
    messageCount: 4,
  },
];

// ─── Mensajes ─────────────────────────────────────────────────────────────────

const MESSAGES = [

  // ── GlobalTrade S1: tractores ────────────────────────────────────────────
  msg(CONV_IDS.gt_1, USER_IDS.owner_globaltrade, COMPANY_IDS.globaltrade, 'user',
    '¿Cuál es la partida arancelaria para importar tractores agrícolas de más de 18 kW a Colombia?', 'tariff'),
  msg(CONV_IDS.gt_1, USER_IDS.owner_globaltrade, COMPANY_IDS.globaltrade, 'assistant',
    'Los tractores agrícolas de más de 18 kW se clasifican bajo la partida HS 8701.91 según el Arancel de Aduanas colombiano vigente (Decreto 1881 de 2021). Esta partida corresponde a "Tractores de potencia superior a 18 kW pero inferior o igual a 37 kW". ¿Necesitas información sobre los aranceles aplicables o los requisitos de importación?'),
  msg(CONV_IDS.gt_1, USER_IDS.owner_globaltrade, COMPANY_IDS.globaltrade, 'user',
    '¿Cuál es el arancel desde Estados Unidos con TLC?', 'treaty'),
  msg(CONV_IDS.gt_1, USER_IDS.owner_globaltrade, COMPANY_IDS.globaltrade, 'assistant',
    'Con el TLC Colombia-USA vigente, los tractores agrícolas bajo 8701.91 gozan de preferencia arancelaria del 0% desde Estados Unidos. La tasa general sin acuerdo es del 5%. Para acceder a la preferencia debes presentar Certificado de Origen acreditando que el bien cumple las reglas de origen del acuerdo.'),

  // ── GlobalTrade S2: cosméticos Alemania ──────────────────────────────────
  msg(CONV_IDS.gt_2, USER_IDS.owner_globaltrade, COMPANY_IDS.globaltrade, 'user',
    'Quiero exportar cremas hidratantes de Colombia a Alemania. ¿Qué regulaciones aplican?', 'regulatory'),
  msg(CONV_IDS.gt_2, USER_IDS.owner_globaltrade, COMPANY_IDS.globaltrade, 'assistant',
    'Para exportar cosméticos a Alemania debes cumplir el Reglamento CE 1223/2009. Los requisitos principales son: (1) Designar un Responsable en la UE, (2) Notificación en el Portal CPNP antes de la comercialización, (3) Elaborar el Dossier de Información del Producto (PIF) con evaluación de seguridad, (4) Etiquetado en alemán con INCI list y fecha de durabilidad.'),
  msg(CONV_IDS.gt_2, USER_IDS.owner_globaltrade, COMPANY_IDS.globaltrade, 'user',
    '¿Qué partida arancelaria corresponde a las cremas hidratantes?', 'tariff'),
  msg(CONV_IDS.gt_2, USER_IDS.owner_globaltrade, COMPANY_IDS.globaltrade, 'assistant',
    'Las cremas hidratantes se clasifican bajo HS 3304.99 — "Preparaciones de belleza y cuidado de la piel, las demás". El arancel de importación desde Colombia a la UE es 0% bajo el Acuerdo Comercial UE-Colombia (vigente desde 2013), siempre que el producto acredite origen colombiano. El IVA alemán aplicable es del 19%.'),

  // ── ComerExport S1: antidumping acero ───────────────────────────────────
  msg(CONV_IDS.comer_1, USER_IDS.owner_comer, COMPANY_IDS.comerexport, 'user',
    '¿Qué medidas antidumping tiene la UE vigentes contra el acero chino en 2024?', 'sanctions'),
  msg(CONV_IDS.comer_1, USER_IDS.owner_comer, COMPANY_IDS.comerexport, 'assistant',
    'La UE mantiene múltiples medidas antidumping contra productos siderúrgicos chinos. Las principales vigentes en 2024 incluyen: (1) Reglamento UE 2022/191 — chapas de acero laminadas en frío (derechos entre 17.9% y 22.1%), (2) Reglamento UE 2021/2268 — tubos y perfiles de acero sin soldadura, (3) Acero revestido de material orgánico (derechos hasta 26.1%). Todas estas medidas están publicadas en el TARIC de la Comisión Europea.'),
  msg(CONV_IDS.comer_1, USER_IDS.owner_comer, COMPANY_IDS.comerexport, 'user',
    '¿Cómo afectan estas medidas si compramos acero en China y lo reexportamos desde Colombia?', 'regulatory'),
  msg(CONV_IDS.comer_1, USER_IDS.owner_comer, COMPANY_IDS.comerexport, 'assistant',
    'Si el acero es de origen chino y simplemente pasa por Colombia sin transformación sustancial, la UE puede aplicar las mismas medidas antidumping invocando las normas anti-elusión (Reglamento UE 2016/1036, Art. 13). Para evitar esto, el acero debe sufrir una transformación real en Colombia que cambie la partida arancelaria (criterio de cambio de partida). Te recomiendo obtener un dictamen de origen vinculante de la DIAN antes de iniciar la operación.'),

  // ── ComerExport S2: COFEPRIS México ─────────────────────────────────────
  msg(CONV_IDS.comer_2, USER_IDS.admin_comer_1, COMPANY_IDS.comerexport, 'user',
    '¿Qué requisitos exige COFEPRIS para importar alimentos orgánicos a México?', 'regulatory'),
  msg(CONV_IDS.comer_2, USER_IDS.admin_comer_1, COMPANY_IDS.comerexport, 'assistant',
    'Para importar alimentos orgánicos a México con COFEPRIS debes cumplir: (1) Registro sanitario del producto ante COFEPRIS o aviso de importación según el tipo de alimento, (2) Certificación orgánica emitida por organismo acreditado reconocido por SENASICA, (3) Etiquetado conforme a NOM-051-SCFI/SSA1-2010 en español, incluyendo declaración "orgánico" solo si cuenta con certificado, (4) Para productos de origen animal, permiso zoosanitario adicional de SENASICA.'),
  msg(CONV_IDS.comer_2, USER_IDS.admin_comer_1, COMPANY_IDS.comerexport, 'user',
    '¿Qué organismos certificadores orgánicos son reconocidos por SENASICA?', 'regulatory'),
  msg(CONV_IDS.comer_2, USER_IDS.admin_comer_1, COMPANY_IDS.comerexport, 'assistant',
    'SENASICA reconoce certificadores acreditados bajo la Ley de Productos Orgánicos de México. Entre los más utilizados para productos importados están: CCOF, Oregon Tilth, OCIA International (todos acreditados USDA NOP), y certificadores europeos como Ecocert o Bureau Veritas cuando el país de origen tiene acuerdo de equivalencia con México. El listado oficial actualizado está en el SIAP de SAGARPA. El certificado debe indicar explícitamente la validez para exportación a México.'),

  // ── Adriatica S1: CBAM ───────────────────────────────────────────────────
  msg(CONV_IDS.adria_1, USER_IDS.owner_adriatica, COMPANY_IDS.adriatica, 'user',
    '¿Qué es el CBAM y cómo nos afecta como importadores europeos desde 2026?', 'regulatory'),
  msg(CONV_IDS.adria_1, USER_IDS.owner_adriatica, COMPANY_IDS.adriatica, 'assistant',
    'El CBAM (Carbon Border Adjustment Mechanism) es el mecanismo europeo de ajuste en frontera por carbono, establecido por el Reglamento UE 2023/956. A partir del 1 de enero de 2026, los importadores de la UE deberán comprar certificados CBAM para cubrir el carbono incorporado en los productos importados. Los sectores afectados son: acero y hierro, aluminio, cemento, fertilizantes, electricidad e hidrógeno. El precio de los certificados CBAM está vinculado al precio del CO₂ en el mercado ETS europeo.'),
  msg(CONV_IDS.adria_1, USER_IDS.owner_adriatica, COMPANY_IDS.adriatica, 'user',
    '¿Cómo se calcula el carbono incorporado en los productos que importamos?', 'regulatory'),
  msg(CONV_IDS.adria_1, USER_IDS.owner_adriatica, COMPANY_IDS.adriatica, 'assistant',
    'El carbono incorporado se calcula como las emisiones de GEI generadas durante la producción del bien en el país de origen, expresadas en toneladas de CO₂ equivalente por tonelada de producto. El exportador debe proporcionar datos de emisiones verificados por un organismo acreditado según el Reglamento de Ejecución UE 2023/1773. Si el exportador no facilita datos verificados, se aplican valores por defecto ("default values") publicados por la Comisión Europea, que son deliberadamente conservadores para incentivar la transparencia.'),

  // ── Nexus S1: ASEAN/RCEP ─────────────────────────────────────────────────
  msg(CONV_IDS.nexus_1, USER_IDS.owner_nexus, COMPANY_IDS.nexus, 'user',
    '¿Cuáles son las principales ventajas del acuerdo RCEP para nuestra expansión a ASEAN?', 'treaty'),
  msg(CONV_IDS.nexus_1, USER_IDS.owner_nexus, COMPANY_IDS.nexus, 'assistant',
    'El RCEP (Regional Comprehensive Economic Partnership), vigente desde enero 2022, es el mayor bloque comercial del mundo. Para tu expansión a ASEAN las ventajas clave son: (1) Eliminación progresiva de aranceles entre 15 países (ASEAN + China, Japón, Corea del Sur, Australia y Nueva Zelanda), (2) Reglas de origen unificadas — acumulación regional completa, lo que facilita cadenas de suministro multi-país, (3) Capítulo de comercio electrónico e inversiones con mayor certeza jurídica, (4) Reducción de barreras no arancelarias en servicios. El cronograma de desgravación varía por país y producto — te recomiendo verificar en la base de datos RCEP Tariff Finder.'),
  msg(CONV_IDS.nexus_1, USER_IDS.owner_nexus, COMPANY_IDS.nexus, 'user',
    '¿Qué país ASEAN tiene los aranceles más bajos para tecnología de consumo?', 'tariff'),
  msg(CONV_IDS.nexus_1, USER_IDS.owner_nexus, COMPANY_IDS.nexus, 'assistant',
    'Singapur es el mercado con aranceles más bajos de ASEAN para tecnología de consumo — prácticamente cero arancel en electrónica bajo el ITA (Information Technology Agreement) de la OMC y sin IVA en importaciones B2B. Vietnam ofrece aranceles reducidos bajo RCEP para electrónica de Japón y Corea del Sur, lo que lo hace atractivo como hub de ensamblaje regional. Malasia aplica 0% en la mayoría de componentes electrónicos. Por contraste, Indonesia y Tailandia mantienen aranceles de 5-15% en electrónica de consumo fuera de los acuerdos preferenciales.'),

  // ── Nexus S2: dual-use EAR/ITAR ─────────────────────────────────────────
  msg(CONV_IDS.nexus_2, USER_IDS.admin_nexus_1, COMPANY_IDS.nexus, 'user',
    '¿Cuál es la diferencia entre EAR e ITAR para controlar exportaciones de tecnología?', 'sanctions'),
  msg(CONV_IDS.nexus_2, USER_IDS.admin_nexus_1, COMPANY_IDS.nexus, 'assistant',
    'EAR (Export Administration Regulations) e ITAR (International Traffic in Arms Regulations) son los dos marcos de control de exportaciones de EE.UU. EAR, administrado por BIS/Departamento de Comercio, controla bienes y tecnología de doble uso (civil y militar) clasificados en la Commerce Control List (CCL) por ECCN. ITAR, administrado por DDTC/Departamento de Estado, controla artículos y servicios de defensa listados en la USML (United States Munitions List). La diferencia clave: si un ítem está en la USML, aplica ITAR y no EAR; si está en la CCL, aplica EAR. El incumplimiento de ITAR tiene sanciones penales más severas.'),
  msg(CONV_IDS.nexus_2, USER_IDS.admin_nexus_1, COMPANY_IDS.nexus, 'user',
    '¿Cómo determinamos si nuestro producto requiere licencia de exportación BIS?', 'sanctions'),
  msg(CONV_IDS.nexus_2, USER_IDS.admin_nexus_1, COMPANY_IDS.nexus, 'assistant',
    'El proceso de determinación tiene 3 pasos: (1) Clasificar el ítem — revisar si aparece en la CCL con un ECCN específico o si es EAR99 (sin control especial), (2) Verificar el país destino — la CCL indica para qué países y usos finales se requiere licencia según el ECCN, (3) Revisar el uso final y usuario final — incluso ítems EAR99 requieren licencia si el destinatario está en la Entity List, Denied Persons List o si el uso final es proliferación de armas. El BIS ofrece la herramienta SNAP-R online para solicitar licencias y clasificaciones. Te recomiendo también hacer una due diligence del importador contra las listas de sanciones OFAC antes de cerrar cualquier operación.'),
];

module.exports = { CONVERSATIONS, MESSAGES };
