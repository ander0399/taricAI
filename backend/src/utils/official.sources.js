/**
 * @description Mapa de fuentes arancelarias oficiales por ISO alpha-3.
 * Importado por tariff.service.js — consultadas en paralelo con Promise.allSettled.
 * Si una fuente falla o hace timeout, el error se registra en ClassificationSources
 * y el flujo continúa con las demás fuentes disponibles.
 *
 * Tipos de fuente:
 * 'customs'       — Aduana nacional (autoridad principal)
 * 'tariff_db'     — Base de datos arancelaria oficial (nomenclatura + tasas)
 * 'trade_window'  — Ventanilla única de comercio exterior
 * 'trade_ministry'— Ministerio de Comercio / Economía
 * 'sanitary'      — Autoridad sanitaria (INVIMA, FDA, ANVISA...)
 * 'phytosanitary' — Autoridad fitosanitaria y zoosanitaria
 * 'export_control'— Control de exportaciones y uso dual
 * 'trade_promo'   — Agencia de promoción de exportaciones
 * 'market_access' — Herramienta de acceso a mercados
 * 'chemical_reg'  — Registro de sustancias químicas y REACH
 */
const officialSources = {
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
    { name: 'COFEPRIS',    url: 'https://www.cofepris.gob.mx',    type: 'sanitary'       },
    { name: 'SADER',       url: 'https://www.gob.mx/sader',       type: 'phytosanitary'  },
    { name: 'ProMéxico',   url: 'https://www.gob.mx/se',          type: 'trade_promo'    },
  ]},
  USA: { name: 'Estados Unidos', sources: [
    { name: 'CBP',          url: 'https://www.cbp.gov',            type: 'customs'        },
    { name: 'HTS / USITC',  url: 'https://hts.usitc.gov',         type: 'tariff_db'      },
    { name: 'FDA',           url: 'https://www.fda.gov',           type: 'sanitary'       },
    { name: 'USDA-APHIS',    url: 'https://www.usda.gov',          type: 'phytosanitary'  },
    { name: 'BIS',           url: 'https://www.bis.doc.gov',       type: 'export_control' },
  ]},
  EUR: { name: 'Unión Europea', sources: [
    { name: 'TARIC / EC',      url: 'https://ec.europa.eu/taxation_customs/dds2/taric', type: 'tariff_db'    },
    { name: 'Access2Markets',  url: 'https://trade.ec.europa.eu/access-to-markets',     type: 'market_access'},
    { name: 'ECHA',            url: 'https://echa.europa.eu',                           type: 'chemical_reg' },
  ]},
  GBR: { name: 'Reino Unido', sources: [
    { name: 'UK Trade Tariff', url: 'https://www.gov.uk/trade-tariff',                         type: 'tariff_db' },
    { name: 'HMRC',            url: 'https://www.gov.uk/government/organisations/hm-revenue-customs', type: 'customs'   },
  ]},
  BRA: { name: 'Brasil', sources: [
    { name: 'Receita Federal', url: 'https://www.gov.br/receitafederal', type: 'customs'       },
    { name: 'NCM / NF-e',     url: 'https://www.nfe.fazenda.gov.br',    type: 'tariff_db'     },
    { name: 'ANVISA',         url: 'https://www.gov.br/anvisa',         type: 'sanitary'      },
    { name: 'MAPA',           url: 'https://www.gov.br/agricultura',    type: 'phytosanitary' },
    { name: 'MDIC',           url: 'https://www.gov.br/mdic',           type: 'trade_ministry'},
  ]},
  ARG: { name: 'Argentina', sources: [
    { name: 'AFIP / DGA', url: 'https://www.afip.gob.ar/aduana',    type: 'customs'        },
    { name: 'MINCETUR AR',url: 'https://www.argentina.gob.ar/economia', type: 'trade_ministry'},
  ]},
  CHL: { name: 'Chile', sources: [
    { name: 'Aduana Chile', url: 'https://www.aduana.cl',            type: 'customs'       },
    { name: 'DIRECON',      url: 'https://www.direcon.gob.cl',       type: 'trade_ministry'},
    { name: 'ProChile',     url: 'https://www.prochile.gob.cl',      type: 'trade_promo'   },
  ]},
  PER: { name: 'Perú', sources: [
    { name: 'SUNAT',    url: 'https://www.sunat.gob.pe',       type: 'customs'        },
    { name: 'MINCETUR', url: 'https://www.mincetur.gob.pe',    type: 'trade_ministry' },
    { name: 'SENASA',   url: 'https://www.senasa.gob.pe',      type: 'phytosanitary'  },
  ]},
  CAN: { name: 'Canadá', sources: [
    { name: 'CBSA',          url: 'https://www.cbsa-asfc.gc.ca',  type: 'customs'   },
    { name: 'Tariff Finder', url: 'https://www.tariffinder.ca',   type: 'tariff_db' },
    { name: 'CFIA',          url: 'https://www.canada.ca/en/canadian-food-inspection-agency', type: 'phytosanitary'},
  ]},
  CHN: { name: 'China', sources: [
    { name: 'GACC',   url: 'http://english.customs.gov.cn',   type: 'customs'        },
    { name: 'MOFCOM', url: 'http://english.mofcom.gov.cn',    type: 'trade_ministry' },
    { name: 'SAMR',   url: 'https://www.samr.gov.cn',         type: 'sanitary'       },
  ]},
  JPN: { name: 'Japón', sources: [
    { name: 'Japan Customs', url: 'https://www.customs.go.jp',      type: 'customs'       },
    { name: 'METI',          url: 'https://www.meti.go.jp',         type: 'trade_ministry'},
    { name: 'JETRO',         url: 'https://www.jetro.go.jp',        type: 'market_access' },
  ]},
  KOR: { name: 'Corea del Sur', sources: [
    { name: 'Korea Customs', url: 'https://www.customs.go.kr',      type: 'customs'        },
    { name: 'KOTRA',         url: 'https://www.kotra.or.kr',        type: 'trade_promo'    },
  ]},
  AUS: { name: 'Australia', sources: [
    { name: 'ABF',           url: 'https://www.abf.gov.au',         type: 'customs'        },
    { name: 'DAFF',          url: 'https://www.agriculture.gov.au', type: 'phytosanitary'  },
  ]},
  IND: { name: 'India', sources: [
    { name: 'CBIC',          url: 'https://www.cbic.gov.in',        type: 'customs'        },
    { name: 'DGFT',          url: 'https://dgft.gov.in',            type: 'trade_ministry' },
    { name: 'FSSAI',         url: 'https://www.fssai.gov.in',       type: 'sanitary'       },
  ]},
  SGP: { name: 'Singapur', sources: [
    { name: 'Singapore Customs', url: 'https://www.customs.gov.sg', type: 'customs' },
    { name: 'ESG',               url: 'https://www.enterprisesg.gov.sg', type: 'trade_promo'},
  ]},
  TUR: { name: 'Turquía', sources: [
    { name: 'Turkish Customs', url: 'https://www.gumruk.gov.tr',    type: 'customs' },
  ]},
  ZAF: { name: 'Sudáfrica', sources: [
    { name: 'SARS',            url: 'https://www.sars.gov.za',      type: 'customs' },
  ]},
  ARE: { name: 'Emiratos Árabes Unidos', sources: [
    { name: 'FCA / Dubai',     url: 'https://www.fca.gov.ae',       type: 'customs' },
  ]},
  SAU: { name: 'Arabia Saudita', sources: [
    { name: 'ZATCA',           url: 'https://zatca.gov.sa',         type: 'customs' },
  ]},
  DEU: { name: 'Alemania', sources: [
    { name: 'Zoll / DEB',      url: 'https://www.zoll.de',          type: 'customs'        },
    { name: 'BAFA',            url: 'https://www.bafa.de',          type: 'export_control' },
  ]},
  FRA: { name: 'Francia', sources: [
    { name: 'Douanes FR',      url: 'https://www.douane.gouv.fr',   type: 'customs' },
  ]},
  ESP: { name: 'España', sources: [
    { name: 'AEAT',            url: 'https://www.agenciatributaria.es', type: 'customs'       },
    { name: 'ICEX',            url: 'https://www.icex.es',              type: 'trade_promo'   },
  ]},
  ITA: { name: 'Italia', sources: [
    { name: 'Agenzia Dogane',  url: 'https://www.adm.gov.it',       type: 'customs' },
  ]},
  NLD: { name: 'Países Bajos', sources: [
    { name: 'Belastingdienst', url: 'https://www.belastingdienst.nl', type: 'customs' },
  ]},
  RUS: { name: 'Rusia', sources: [
    { name: 'FCS Russia',      url: 'https://www.customs.ru',       type: 'customs' },
  ]},
  ECU: { name: 'Ecuador', sources: [
    { name: 'SENAE',           url: 'https://www.aduana.gob.ec',    type: 'customs'        },
    { name: 'MIPRO',           url: 'https://www.produccion.gob.ec',type: 'trade_ministry' },
  ]},
  BOL: { name: 'Bolivia', sources: [
    { name: 'Aduana Bolivia',  url: 'https://www.aduana.gob.bo',    type: 'customs' },
  ]},
  PRY: { name: 'Paraguay', sources: [
    { name: 'DNA Paraguay',    url: 'https://www.aduana.gov.py',    type: 'customs' },
  ]},
  URY: { name: 'Uruguay', sources: [
    { name: 'DNA Uruguay',     url: 'https://www.aduanas.gub.uy',   type: 'customs' },
    { name: 'Uruguay XXI',     url: 'https://www.uruguayxxi.gub.uy',type: 'trade_promo' },
  ]},
  VEN: { name: 'Venezuela', sources: [
    { name: 'SENIAT',          url: 'https://www.seniat.gob.ve',    type: 'customs' },
  ]},
  GTM: { name: 'Guatemala', sources: [
    { name: 'SAT Guatemala',   url: 'https://portal.sat.gob.gt',    type: 'customs' },
  ]},
  CRI: { name: 'Costa Rica', sources: [
    { name: 'TICA / HACIENDA', url: 'https://www.hacienda.go.cr',   type: 'customs' },
    { name: 'PROCOMER',        url: 'https://www.procomer.com',      type: 'trade_promo' },
  ]},
  PAN: { name: 'Panamá', sources: [
    { name: 'ANA Panamá',      url: 'https://www.ana.gob.pa',       type: 'customs' },
  ]},
  DOM: { name: 'República Dominicana', sources: [
    { name: 'DGA RD',          url: 'https://www.aduanas.gob.do',   type: 'customs' },
  ]},
  CUB: { name: 'Cuba', sources: [
    { name: 'ADUANA CUBA',     url: 'https://www.aduana.co.cu',     type: 'customs' },
  ]},
  MYS: { name: 'Malasia', sources: [
    { name: 'RMCD',            url: 'https://www.customs.gov.my',   type: 'customs' },
  ]},
  THA: { name: 'Tailandia', sources: [
    { name: 'Thai Customs',    url: 'https://www.customs.go.th',    type: 'customs' },
  ]},
  IDN: { name: 'Indonesia', sources: [
    { name: 'DGCE',            url: 'https://www.beacukai.go.id',   type: 'customs' },
  ]},
  VNM: { name: 'Vietnam', sources: [
    { name: 'Vietnam Customs', url: 'https://www.customs.gov.vn',   type: 'customs' },
  ]},
  PHL: { name: 'Filipinas', sources: [
    { name: 'BOC Philippines', url: 'https://www.customs.gov.ph',   type: 'customs' },
  ]},
  NGA: { name: 'Nigeria', sources: [
    { name: 'NCS Nigeria',     url: 'https://www.customs.gov.ng',   type: 'customs' },
  ]},
  EGY: { name: 'Egipto', sources: [
    { name: 'EFSA Egypt',      url: 'https://www.efsa.gov.eg',      type: 'customs' },
  ]},
  MAR: { name: 'Marruecos', sources: [
    { name: 'ADII Maroc',      url: 'https://www.douane.gov.ma',    type: 'customs' },
  ]},
  CHE: { name: 'Suiza', sources: [
    { name: 'Swiss Customs',   url: 'https://www.ezv.admin.ch',     type: 'customs' },
  ]},
  NOR: { name: 'Noruega', sources: [
    { name: 'Tolletaten',      url: 'https://www.toll.no',          type: 'customs' },
  ]},
  SWE: { name: 'Suecia', sources: [
    { name: 'Tullverket',      url: 'https://www.tullverket.se',    type: 'customs' },
  ]},
  POL: { name: 'Polonia', sources: [
    { name: 'Izba Celna',      url: 'https://www.kis.gov.pl',       type: 'customs' },
  ]},
  NZL: { name: 'Nueva Zelanda', sources: [
    { name: 'NZ Customs',      url: 'https://www.customs.govt.nz',  type: 'customs' },
  ]},
  ISR: { name: 'Israel', sources: [
    { name: 'Israel Customs',  url: 'https://www.customs.mof.gov.il', type: 'customs' },
  ]},
};

/**
 * @description Fuentes multilaterales — se consultan en todas las clasificaciones.
 * Usan código de país 'MUL' en ClassificationSources.
 */
const multilateralSources = [
  { name: 'WCO',    url: 'https://www.wcoomd.org',    type: 'hs_nomenclature'  },
  { name: 'WTO',    url: 'https://www.wto.org',        type: 'trade_agreements' },
  { name: 'ITC',    url: 'https://www.intracen.org',   type: 'market_access'    },
  { name: 'ALADI',  url: 'https://www.aladi.org',      type: 'latam_agreements' },
  { name: 'UNCTAD', url: 'https://unctad.org',          type: 'trade_analysis'   },
];

module.exports = { officialSources, multilateralSources };
