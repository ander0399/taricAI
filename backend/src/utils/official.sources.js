/**
 * @description Mapa de fuentes arancelarias oficiales por ISO alpha-3.
 * Importado por tariff.service.js — consultadas en paralelo con Promise.allSettled.
 * Si una fuente falla o hace timeout, el error se registra en ClassificationSources
 * y el flujo continúa con las demás fuentes disponibles.
 *
 * Tipos de fuente:
 * 'customs'        — Aduana nacional (autoridad principal)
 * 'tariff_db'      — Base de datos arancelaria oficial (nomenclatura + tasas)
 * 'trade_window'   — Ventanilla única de comercio exterior
 * 'trade_ministry' — Ministerio de Comercio / Economía
 * 'sanitary'       — Autoridad sanitaria (INVIMA, FDA, ANVISA...)
 * 'phytosanitary'  — Autoridad fitosanitaria y zoosanitaria
 * 'export_control' — Control de exportaciones y uso dual
 * 'trade_promo'    — Agencia de promoción de exportaciones
 * 'market_access'  — Herramienta de acceso a mercados
 * 'chemical_reg'   — Registro de sustancias químicas y REACH
 * 'tax'            — Autoridad tributaria (IVA/GST)
 * 'agreements'     — Base de datos de acuerdos comerciales
 */
const officialSources = {

  // ─── AMÉRICA ────────────────────────────────────────────────────────────────

  COL: { name: 'Colombia', sources: [
    { name: 'DIAN',        url: 'https://www.dian.gov.co',        type: 'customs'        },
    { name: 'VUCE',        url: 'https://www.vuce.gov.co',        type: 'trade_window'   },
    { name: 'MinCIT',      url: 'https://www.mincit.gov.co',      type: 'trade_ministry' },
    { name: 'INVIMA',      url: 'https://www.invima.gov.co',      type: 'sanitary'       },
    { name: 'ICA',         url: 'https://www.ica.gov.co',         type: 'phytosanitary'  },
    { name: 'ProColombia', url: 'https://www.procolombia.co',     type: 'trade_promo'    },
  ]},

  MEX: { name: 'México', sources: [
    { name: 'SAT / TIGIE', url: 'https://www.sat.gob.mx',         type: 'customs'        },
    { name: 'SE',          url: 'https://www.economia.gob.mx',    type: 'trade_ministry' },
    { name: 'COFEPRIS',    url: 'https://www.gob.mx/cofepris',    type: 'sanitary'       },
    { name: 'SENASICA',    url: 'https://www.gob.mx/senasica',    type: 'phytosanitary'  },
    { name: 'SNICE',       url: 'http://www.snice.gob.mx',        type: 'tariff_db'      },
  ]},

  USA: { name: 'Estados Unidos', sources: [
    { name: 'CBP',         url: 'https://www.cbp.gov',            type: 'customs'        },
    { name: 'HTS / USITC', url: 'https://hts.usitc.gov',         type: 'tariff_db'      },
    { name: 'FDA',         url: 'https://www.fda.gov',            type: 'sanitary'       },
    { name: 'USDA-APHIS',  url: 'https://www.aphis.usda.gov',    type: 'phytosanitary'  },
    { name: 'BIS',         url: 'https://www.bis.gov',            type: 'export_control' },
  ]},

  BRA: { name: 'Brasil', sources: [
    { name: 'Receita Federal / TEC', url: 'https://www.gov.br/receitafederal', type: 'customs'      },
    { name: 'Portal Único Siscomex', url: 'https://portalunico.siscomex.gov.br', type: 'trade_window' },
    { name: 'ANVISA',                url: 'https://www.gov.br/anvisa',           type: 'sanitary'    },
    { name: 'MAPA',                  url: 'https://www.gov.br/agricultura',      type: 'phytosanitary'},
  ]},

  ARG: { name: 'Argentina', sources: [
    { name: 'AFIP / DGA', url: 'https://www.afip.gob.ar/aduana', type: 'customs'      },
    { name: 'ANMAT',      url: 'https://www.argentina.gob.ar/anmat', type: 'sanitary' },
    { name: 'SENASA AR',  url: 'https://www.argentina.gob.ar/senasa', type: 'phytosanitary' },
  ]},

  CHL: { name: 'Chile', sources: [
    { name: 'Aduana Chile', url: 'https://www.aduana.cl',  type: 'customs'       },
    { name: 'ProChile',     url: 'https://www.prochile.gob.cl', type: 'trade_promo' },
    { name: 'SAG Chile',    url: 'https://www.sag.gob.cl', type: 'phytosanitary' },
  ]},

  PER: { name: 'Perú', sources: [
    { name: 'SUNAT',      url: 'https://www.sunat.gob.pe',   type: 'customs'        },
    { name: 'MINCETUR',   url: 'https://www.mincetur.gob.pe', type: 'trade_ministry' },
    { name: 'SENASA PER', url: 'https://www.senasa.gob.pe',  type: 'phytosanitary'  },
  ]},

  ECU: { name: 'Ecuador', sources: [
    { name: 'SENAE',       url: 'https://www.aduana.gob.ec',    type: 'customs'      },
    { name: 'Agrocalidad', url: 'https://www.agrocalidad.gob.ec', type: 'phytosanitary' },
  ]},

  BOL: { name: 'Bolivia',   sources: [{ name: 'Aduana Bolivia', url: 'https://www.aduana.gob.bo', type: 'customs' }] },
  PRY: { name: 'Paraguay',  sources: [{ name: 'DNA Paraguay',   url: 'https://www.aduana.gov.py', type: 'customs' }] },
  URY: { name: 'Uruguay',   sources: [{ name: 'DNA Uruguay',    url: 'https://www.aduanas.gub.uy', type: 'customs' }] },

  CRI: { name: 'Costa Rica',          sources: [{ name: 'DGA Costa Rica',   url: 'https://www.hacienda.go.cr', type: 'customs' }] },
  PAN: { name: 'Panamá',              sources: [{ name: 'ANA Panamá',       url: 'https://www.ana.gob.pa',     type: 'customs' }] },
  DOM: { name: 'República Dominicana',sources: [{ name: 'DGA RD',           url: 'https://www.aduanas.gob.do', type: 'customs' }] },

  CAN: { name: 'Canadá', sources: [
    { name: 'CBSA',              url: 'https://www.cbsa-asfc.gc.ca',  type: 'customs'      },
    { name: 'Canada Tariff Finder', url: 'https://www.cbsa-asfc.gc.ca/trade-commerce/tariff-tarif', type: 'tariff_db' },
    { name: 'CFIA',              url: 'https://inspection.canada.ca', type: 'phytosanitary'},
  ]},

  // ─── EUROPA ─────────────────────────────────────────────────────────────────
  // Para países UE: TARIC/EC + Access2Markets son las fuentes principales.
  // Las entradas nacionales (AEAT, Zoll, etc.) proveen contexto fiscal adicional.

  ESP: { name: 'España', sources: [
    { name: 'TARIC / EC',     url: 'https://ec.europa.eu/taxation_customs/dds2/taric', type: 'tariff_db'    },
    { name: 'Access2Markets', url: 'https://trade.ec.europa.eu/access-to-markets',     type: 'market_access'},
    { name: 'AEAT',           url: 'https://www.agenciatributaria.es',                 type: 'tax'          },
    { name: 'AESAN',          url: 'https://www.aesan.gob.es',                         type: 'sanitary'     },
    { name: 'ECHA',           url: 'https://echa.europa.eu',                           type: 'chemical_reg' },
  ]},

  DEU: { name: 'Alemania', sources: [
    { name: 'TARIC / EC',     url: 'https://ec.europa.eu/taxation_customs/dds2/taric', type: 'tariff_db'    },
    { name: 'Access2Markets', url: 'https://trade.ec.europa.eu/access-to-markets',     type: 'market_access'},
    { name: 'Zoll',           url: 'https://www.zoll.de',                              type: 'customs'      },
  ]},

  FRA: { name: 'Francia', sources: [
    { name: 'TARIC / EC',     url: 'https://ec.europa.eu/taxation_customs/dds2/taric', type: 'tariff_db'    },
    { name: 'Access2Markets', url: 'https://trade.ec.europa.eu/access-to-markets',     type: 'market_access'},
    { name: 'Douane française', url: 'https://www.douane.gouv.fr',                     type: 'customs'      },
  ]},

  ITA: { name: 'Italia', sources: [
    { name: 'TARIC / EC',        url: 'https://ec.europa.eu/taxation_customs/dds2/taric', type: 'tariff_db'    },
    { name: 'Access2Markets',    url: 'https://trade.ec.europa.eu/access-to-markets',     type: 'market_access'},
    { name: 'Agenzia Dogane IT', url: 'https://www.adm.gov.it',                           type: 'customs'      },
  ]},

  NLD: { name: 'Países Bajos', sources: [
    { name: 'TARIC / EC',     url: 'https://ec.europa.eu/taxation_customs/dds2/taric', type: 'tariff_db'    },
    { name: 'Access2Markets', url: 'https://trade.ec.europa.eu/access-to-markets',     type: 'market_access'},
  ]},

  // Fallback genérico para cualquier país UE no listado individualmente
  EUR: { name: 'Unión Europea', sources: [
    { name: 'TARIC / EC',     url: 'https://ec.europa.eu/taxation_customs/dds2/taric', type: 'tariff_db'    },
    { name: 'Access2Markets', url: 'https://trade.ec.europa.eu/access-to-markets',     type: 'market_access'},
    { name: 'ECHA',           url: 'https://echa.europa.eu',                           type: 'chemical_reg' },
  ]},

  GBR: { name: 'Reino Unido', sources: [
    { name: 'UK Trade Tariff', url: 'https://www.trade-tariff.service.gov.uk', type: 'tariff_db' },
    { name: 'HMRC',            url: 'https://www.gov.uk/government/organisations/hm-revenue-customs', type: 'customs' },
  ]},

  TUR: { name: 'Turquía', sources: [
    { name: 'Gümrük TR', url: 'https://ticaret.gov.tr', type: 'tariff_db' },
  ]},

  CHE: { name: 'Suiza', sources: [{ name: 'Swiss Customs', url: 'https://www.bazg.admin.ch', type: 'customs' }] },
  NOR: { name: 'Noruega', sources: [{ name: 'Tolletaten NO', url: 'https://www.toll.no', type: 'customs' }] },
  POL: { name: 'Polonia', sources: [
    { name: 'TARIC / EC',     url: 'https://ec.europa.eu/taxation_customs/dds2/taric', type: 'tariff_db' },
    { name: 'Access2Markets', url: 'https://trade.ec.europa.eu/access-to-markets',     type: 'market_access'},
  ]},

  // ─── ASIA-PACÍFICO ───────────────────────────────────────────────────────────

  CHN: { name: 'China', sources: [
    { name: 'GACC',   url: 'http://online.customs.gov.cn',  type: 'customs'           },
    { name: 'MOFCOM', url: 'http://www.mofcom.gov.cn',      type: 'trade_ministry'    },
    { name: 'SAT CN', url: 'http://www.chinatax.gov.cn',    type: 'tax'               },
    { name: 'CIQ',    url: 'http://www.customs.gov.cn',     type: 'export_control'    },
  ]},

  JPN: { name: 'Japón', sources: [
    { name: 'Japan Customs', url: 'https://www.customs.go.jp/english', type: 'tariff_db'   },
    { name: 'JETRO',         url: 'https://www.jetro.go.jp',           type: 'market_access'},
  ]},

  KOR: { name: 'Corea del Sur', sources: [
    { name: 'Korea Customs Service', url: 'https://www.customs.go.kr/english', type: 'tariff_db' },
    { name: 'MFDS',                  url: 'https://www.mfds.go.kr',            type: 'sanitary'  },
  ]},

  AUS: { name: 'Australia', sources: [
    { name: 'ABF',          url: 'https://www.abf.gov.au',       type: 'customs'   },
    { name: 'FTA Portal AU', url: 'https://ftaportal.dfat.gov.au', type: 'agreements'},
  ]},

  IND: { name: 'India', sources: [
    { name: 'CBIC',               url: 'https://www.cbic.gov.in',         type: 'tariff_db'   },
    { name: 'Indian Trade Portal', url: 'https://www.indiantradeportal.in', type: 'market_access'},
  ]},

  SGP: { name: 'Singapur', sources: [{ name: 'Singapore Customs', url: 'https://www.customs.gov.sg', type: 'tariff_db' }] },
  TWN: { name: 'Taiwán',   sources: [{ name: 'Taiwan Customs',    url: 'https://web.customs.gov.tw', type: 'tariff_db' }] },
  THA: { name: 'Tailandia',sources: [{ name: 'Thai Customs',      url: 'https://www.customs.go.th', type: 'tariff_db' }] },
  VNM: { name: 'Vietnam',  sources: [{ name: 'Vietnam Customs',   url: 'https://www.customs.gov.vn', type: 'tariff_db' }] },
  MYS: { name: 'Malasia',  sources: [{ name: 'Royal Malaysian Customs', url: 'http://www.customs.gov.my', type: 'tariff_db' }] },
  IDN: { name: 'Indonesia',sources: [{ name: 'DJBC Indonesia',    url: 'https://www.beacukai.go.id', type: 'tariff_db' }] },
  PHL: { name: 'Filipinas',sources: [{ name: 'Bureau of Customs PH', url: 'https://customs.gov.ph', type: 'tariff_db' }] },
  NZL: { name: 'Nueva Zelanda', sources: [{ name: 'NZ Customs', url: 'https://www.customs.govt.nz', type: 'tariff_db' }] },

  // ─── MEDIO ORIENTE Y ÁFRICA ──────────────────────────────────────────────────

  ARE: { name: 'Emiratos Árabes', sources: [
    { name: 'FCA UAE',      url: 'https://www.customs.ae',          type: 'customs' },
    { name: 'Dubai Customs', url: 'https://www.dubaicustoms.gov.ae', type: 'customs' },
  ]},

  SAU: { name: 'Arabia Saudita', sources: [{ name: 'ZATCA', url: 'https://zatca.gov.sa', type: 'tariff_db' }] },
  ISR: { name: 'Israel',         sources: [{ name: 'Israel Tax Authority', url: 'https://taxes.gov.il/english', type: 'tariff_db' }] },
  ZAF: { name: 'Sudáfrica',      sources: [{ name: 'SARS',  url: 'https://www.sars.gov.za', type: 'tariff_db' }] },
  EGY: { name: 'Egipto',         sources: [{ name: 'Egyptian Customs', url: 'https://www.customs.gov.eg', type: 'tariff_db' }] },
  NGA: { name: 'Nigeria',        sources: [{ name: 'Nigeria Customs', url: 'https://customs.gov.ng', type: 'tariff_db' }] },
  KEN: { name: 'Kenia',          sources: [{ name: 'KRA Customs', url: 'https://www.kra.go.ke', type: 'tariff_db' }] },
  MAR: { name: 'Marruecos',      sources: [{ name: 'ADII Maroc', url: 'https://www.douane.gov.ma', type: 'tariff_db' }] },
};

/**
 * Fuentes multilaterales — siempre consultadas independientemente de los países.
 * Proporcionan datos de acuerdos comerciales, nomenclatura HS y aranceles consolidados.
 */
const multilateralSources = [
  { name: 'WCO — HS Nomenclatura',        url: 'https://www.wcoomd.org',               type: 'hs_nomenclature', countryCode: 'MUL' },
  { name: 'WTO — Tariff Analysis Online', url: 'https://tao.wto.org',                  type: 'tariff_data',     countryCode: 'MUL' },
  { name: 'WTO — RTA Database',           url: 'https://rtais.wto.org',                type: 'agreements',      countryCode: 'MUL' },
  { name: 'ITC — Market Access Map',      url: 'https://www.macmap.org',               type: 'tariff_ntb',      countryCode: 'MUL' },
  { name: 'ITC — Trade Map',              url: 'https://www.trademap.org',             type: 'trade_flows',     countryCode: 'MUL' },
  { name: 'UNCTAD — TRAINS',             url: 'https://trainsonline.unctad.org',       type: 'ntb',             countryCode: 'MUL' },
  { name: 'ALADI — Preferencias',        url: 'http://consultawebv2.aladi.org/sicoexV2', type: 'agreements_latam', countryCode: 'MUL' },
  { name: 'Access2Markets (UE)',          url: 'https://trade.ec.europa.eu/access-to-markets', type: 'market_access', countryCode: 'MUL' },
];

/**
 * @description Resolve sources for a country, falling back to EU sources for EU member states
 *              not individually listed, or to empty array if truly unknown.
 * @param {string} countryCode - ISO alpha-3
 * @returns {Array}
 */
function getCountrySources(countryCode) {
  if (officialSources[countryCode]) {
    return officialSources[countryCode].sources;
  }
  // EU member states not individually listed → use generic EUR entry
  const EU_MEMBERS = new Set(['AUT','BEL','BGR','CYP','CZE','DNK','EST','FIN','GRC','HRV','HUN','IRL','LTU','LUX','LVA','MLT','PRT','ROU','SVK','SVN','SWE']);
  if (EU_MEMBERS.has(countryCode)) {
    return officialSources.EUR.sources;
  }
  return [];
}

module.exports = { officialSources, multilateralSources, getCountrySources };
