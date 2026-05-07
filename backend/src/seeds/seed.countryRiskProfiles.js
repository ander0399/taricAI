const { CountryRiskProfiles } = require('../models');
const { countries } = require('../utils/countries.data');

const REGION_MAP = {
  // ── Africa ───────────────────────────────────────────────────────────────────
  AGO: 'Africa', DZA: 'Africa', CMR: 'Africa', CPV: 'Africa', CIV: 'Africa',
  COD: 'Africa', COG: 'Africa', EGY: 'Africa', ETH: 'Africa', GAB: 'Africa',
  GHA: 'Africa', KEN: 'Africa', LBY: 'Africa', MDG: 'Africa', MAR: 'Africa',
  MUS: 'Africa', MOZ: 'Africa', NGA: 'Africa', RWA: 'Africa', SEN: 'Africa',
  ZAF: 'Africa', SDN: 'Africa', TZA: 'Africa', TUN: 'Africa', UGA: 'Africa',
  ZMB: 'Africa', ZWE: 'Africa', BFA: 'Africa', GIN: 'Africa', SLE: 'Africa',
  LBR: 'Africa', MLI: 'Africa', NER: 'Africa', TGO: 'Africa', BEN: 'Africa',
  BDI: 'Africa', ERI: 'Africa', SOM: 'Africa', CAF: 'Africa', GNQ: 'Africa',
  COM: 'Africa', DJI: 'Africa', LSO: 'Africa', MWI: 'Africa', NAM: 'Africa',
  BWA: 'Africa',

  // ── Americas ─────────────────────────────────────────────────────────────────
  ARG: 'Americas', BHS: 'Americas', BRB: 'Americas', BLZ: 'Americas',
  BOL: 'Americas', BRA: 'Americas', CAN: 'Americas', CHL: 'Americas',
  COL: 'Americas', CRI: 'Americas', CUB: 'Americas', DOM: 'Americas',
  ECU: 'Americas', SLV: 'Americas', GTM: 'Americas', GUY: 'Americas',
  HTI: 'Americas', HND: 'Americas', JAM: 'Americas', MEX: 'Americas',
  NIC: 'Americas', PAN: 'Americas', PRY: 'Americas', PER: 'Americas',
  SUR: 'Americas', TTO: 'Americas', USA: 'Americas', URY: 'Americas',
  VEN: 'Americas',

  // ── Asia ─────────────────────────────────────────────────────────────────────
  AFG: 'Asia', ARM: 'Asia', AZE: 'Asia', BGD: 'Asia', BRN: 'Asia',
  KHM: 'Asia', CHN: 'Asia', GEO: 'Asia', HKG: 'Asia', IND: 'Asia',
  IDN: 'Asia', JPN: 'Asia', KAZ: 'Asia', KOR: 'Asia', LAO: 'Asia',
  MAC: 'Asia', MYS: 'Asia', MDV: 'Asia', MNG: 'Asia', MMR: 'Asia',
  NPL: 'Asia', PAK: 'Asia', PHL: 'Asia', SGP: 'Asia', LKA: 'Asia',
  TWN: 'Asia', THA: 'Asia', TLS: 'Asia', TKM: 'Asia', UZB: 'Asia',
  VNM: 'Asia', KGZ: 'Asia', TJK: 'Asia', PRK: 'Asia',

  // ── MiddleEast ───────────────────────────────────────────────────────────────
  BHR: 'MiddleEast', IRN: 'MiddleEast', IRQ: 'MiddleEast', ISR: 'MiddleEast',
  JOR: 'MiddleEast', KWT: 'MiddleEast', LBN: 'MiddleEast', OMN: 'MiddleEast',
  QAT: 'MiddleEast', SAU: 'MiddleEast', SYR: 'MiddleEast', ARE: 'MiddleEast',
  YEM: 'MiddleEast', TUR: 'MiddleEast',

  // ── Europe ───────────────────────────────────────────────────────────────────
  ALB: 'Europe', AUT: 'Europe', BLR: 'Europe', BEL: 'Europe', BIH: 'Europe',
  BGR: 'Europe', HRV: 'Europe', CZE: 'Europe', DNK: 'Europe', EST: 'Europe',
  FIN: 'Europe', FRA: 'Europe', DEU: 'Europe', GRC: 'Europe', HUN: 'Europe',
  ISL: 'Europe', IRL: 'Europe', ITA: 'Europe', XKX: 'Europe', LVA: 'Europe',
  LTU: 'Europe', LUX: 'Europe', MDA: 'Europe', MKD: 'Europe', MNE: 'Europe',
  NLD: 'Europe', NOR: 'Europe', POL: 'Europe', PRT: 'Europe', ROU: 'Europe',
  RUS: 'Europe', SRB: 'Europe', SVK: 'Europe', SVN: 'Europe', ESP: 'Europe',
  SWE: 'Europe', CHE: 'Europe', UKR: 'Europe', GBR: 'Europe',

  // ── Oceania ──────────────────────────────────────────────────────────────────
  AUS: 'Oceania', FJI: 'Oceania', NZL: 'Oceania', PNG: 'Oceania',
};

// TRS por país (escala 1–10): <4=low · 4-4.9=medium · 5-6.9=high · ≥7=critical
// Basado en índices EIU, PRS Group, Coface, BERI (mayo 2026)
const TRS_SEED = {
  // ── Muy bajo riesgo (1.0–2.9) ────────────────────────────────────────────────
  NOR: { o: 1.8, a: 1.7, l: 1.9, n: 1.8, g: 1.9, trend: 'stable'       },
  CHE: { o: 1.9, a: 1.8, l: 2.0, n: 1.9, g: 2.0, trend: 'stable'       },
  DNK: { o: 2.0, a: 1.9, l: 2.1, n: 2.0, g: 2.0, trend: 'stable'       },
  FIN: { o: 2.0, a: 1.9, l: 2.1, n: 2.0, g: 2.1, trend: 'stable'       },
  SWE: { o: 2.1, a: 2.0, l: 2.2, n: 2.0, g: 2.1, trend: 'stable'       },
  ISL: { o: 2.1, a: 2.0, l: 2.2, n: 2.1, g: 2.2, trend: 'stable'       },
  NLD: { o: 2.2, a: 2.1, l: 2.3, n: 2.2, g: 2.2, trend: 'stable'       },
  LUX: { o: 2.2, a: 2.1, l: 2.3, n: 2.1, g: 2.3, trend: 'stable'       },
  NZL: { o: 2.2, a: 2.1, l: 2.3, n: 2.2, g: 2.3, trend: 'stable'       },
  AUS: { o: 2.3, a: 2.2, l: 2.4, n: 2.3, g: 2.4, trend: 'stable'       },
  DEU: { o: 2.3, a: 2.2, l: 2.4, n: 2.2, g: 2.5, trend: 'stable'       },
  AUT: { o: 2.4, a: 2.3, l: 2.5, n: 2.3, g: 2.5, trend: 'stable'       },
  SGP: { o: 2.4, a: 2.3, l: 2.5, n: 2.3, g: 2.4, trend: 'stable'       },
  JPN: { o: 2.5, a: 2.4, l: 2.6, n: 2.4, g: 2.6, trend: 'stable'       },
  USA: { o: 2.5, a: 2.4, l: 2.6, n: 2.5, g: 2.7, trend: 'stable'       },
  CAN: { o: 2.5, a: 2.4, l: 2.6, n: 2.4, g: 2.6, trend: 'stable'       },
  GBR: { o: 2.6, a: 2.5, l: 2.7, n: 2.6, g: 2.8, trend: 'stable'       },
  IRL: { o: 2.6, a: 2.5, l: 2.7, n: 2.5, g: 2.7, trend: 'stable'       },
  BEL: { o: 2.7, a: 2.6, l: 2.8, n: 2.6, g: 2.8, trend: 'stable'       },
  FRA: { o: 2.8, a: 2.7, l: 2.9, n: 2.7, g: 3.0, trend: 'stable'       },
  HKG: { o: 2.9, a: 2.8, l: 3.0, n: 2.8, g: 3.2, trend: 'stable'       },
  TWN: { o: 2.9, a: 2.8, l: 3.0, n: 2.8, g: 3.4, trend: 'deteriorating'},

  // ── Bajo riesgo (3.0–3.9) ────────────────────────────────────────────────────
  KOR: { o: 3.1, a: 3.0, l: 3.2, n: 3.0, g: 3.5, trend: 'stable'       },
  EST: { o: 3.1, a: 3.0, l: 3.2, n: 3.1, g: 3.2, trend: 'stable'       },
  SVN: { o: 3.1, a: 3.0, l: 3.2, n: 3.0, g: 3.2, trend: 'stable'       },
  CZE: { o: 3.2, a: 3.1, l: 3.3, n: 3.1, g: 3.3, trend: 'stable'       },
  LVA: { o: 3.2, a: 3.1, l: 3.3, n: 3.2, g: 3.3, trend: 'stable'       },
  LTU: { o: 3.3, a: 3.2, l: 3.4, n: 3.2, g: 3.4, trend: 'stable'       },
  ARE: { o: 3.3, a: 3.2, l: 3.4, n: 3.3, g: 3.5, trend: 'stable'       },
  MYS: { o: 3.5, a: 3.4, l: 3.6, n: 3.4, g: 3.7, trend: 'stable'       },
  CHL: { o: 3.5, a: 3.4, l: 3.6, n: 3.5, g: 3.6, trend: 'stable'       },
  POL: { o: 3.5, a: 3.4, l: 3.6, n: 3.4, g: 3.7, trend: 'stable'       },
  SVK: { o: 3.6, a: 3.5, l: 3.7, n: 3.5, g: 3.7, trend: 'stable'       },
  HRV: { o: 3.7, a: 3.6, l: 3.8, n: 3.6, g: 3.8, trend: 'stable'       },
  QAT: { o: 3.7, a: 3.6, l: 3.8, n: 3.6, g: 3.9, trend: 'stable'       },
  BWA: { o: 3.8, a: 3.7, l: 3.9, n: 3.7, g: 3.9, trend: 'stable'       },
  URY: { o: 3.8, a: 3.7, l: 3.9, n: 3.8, g: 3.9, trend: 'stable'       },
  NAM: { o: 3.9, a: 3.8, l: 4.0, n: 3.8, g: 4.0, trend: 'stable'       },

  // ── Riesgo medio (4.0–4.9) ───────────────────────────────────────────────────
  ITA: { o: 4.0, a: 3.9, l: 4.1, n: 4.0, g: 4.2, trend: 'stable'       },
  ESP: { o: 4.1, a: 4.0, l: 4.2, n: 4.0, g: 4.2, trend: 'stable'       },
  PRT: { o: 4.1, a: 4.0, l: 4.2, n: 4.0, g: 4.3, trend: 'stable'       },
  SAU: { o: 4.2, a: 4.1, l: 4.3, n: 4.1, g: 4.5, trend: 'stable'       },
  OMN: { o: 4.2, a: 4.1, l: 4.3, n: 4.1, g: 4.4, trend: 'stable'       },
  GEO: { o: 4.3, a: 4.2, l: 4.4, n: 4.2, g: 4.6, trend: 'stable'       },
  MNE: { o: 4.3, a: 4.2, l: 4.4, n: 4.2, g: 4.5, trend: 'stable'       },
  HUN: { o: 4.4, a: 4.3, l: 4.5, n: 4.3, g: 4.6, trend: 'stable'       },
  THA: { o: 4.4, a: 4.3, l: 4.5, n: 4.3, g: 4.6, trend: 'stable'       },
  ROU: { o: 4.5, a: 4.4, l: 4.6, n: 4.4, g: 4.6, trend: 'stable'       },
  BGR: { o: 4.5, a: 4.4, l: 4.6, n: 4.4, g: 4.7, trend: 'stable'       },
  CHN: { o: 4.5, a: 4.4, l: 4.6, n: 4.5, g: 5.0, trend: 'stable'       },
  SRB: { o: 4.5, a: 4.4, l: 4.6, n: 4.4, g: 4.7, trend: 'stable'       },
  ARM: { o: 4.6, a: 4.5, l: 4.7, n: 4.5, g: 4.9, trend: 'stable'       },
  GRC: { o: 4.6, a: 4.5, l: 4.7, n: 4.5, g: 4.8, trend: 'stable'       },
  MKD: { o: 4.6, a: 4.5, l: 4.7, n: 4.5, g: 4.8, trend: 'stable'       },
  IND: { o: 4.6, a: 4.5, l: 4.7, n: 4.5, g: 4.9, trend: 'improving'    },
  MAR: { o: 4.6, a: 4.5, l: 4.7, n: 4.5, g: 4.8, trend: 'stable'       },
  VNM: { o: 4.7, a: 4.6, l: 4.8, n: 4.6, g: 4.9, trend: 'improving'    },
  JOR: { o: 4.7, a: 4.6, l: 4.8, n: 4.6, g: 5.0, trend: 'stable'       },
  KWT: { o: 4.7, a: 4.6, l: 4.8, n: 4.6, g: 5.0, trend: 'stable'       },
  IDN: { o: 4.7, a: 4.6, l: 4.8, n: 4.6, g: 4.9, trend: 'stable'       },
  CRI: { o: 4.7, a: 4.6, l: 4.8, n: 4.6, g: 4.8, trend: 'stable'       },
  ALB: { o: 4.8, a: 4.7, l: 4.9, n: 4.7, g: 4.9, trend: 'stable'       },
  BIH: { o: 4.8, a: 4.7, l: 4.9, n: 4.7, g: 5.0, trend: 'stable'       },
  PER: { o: 4.8, a: 4.7, l: 4.9, n: 4.7, g: 5.0, trend: 'stable'       },
  KHM: { o: 4.8, a: 4.7, l: 4.9, n: 4.7, g: 5.0, trend: 'stable'       },
  GHA: { o: 4.8, a: 4.7, l: 4.9, n: 4.7, g: 5.0, trend: 'stable'       },
  SEN: { o: 4.8, a: 4.7, l: 4.9, n: 4.7, g: 5.0, trend: 'improving'    },
  RWA: { o: 4.8, a: 4.7, l: 4.9, n: 4.7, g: 5.0, trend: 'improving'    },
  DOM: { o: 4.8, a: 4.7, l: 4.9, n: 4.7, g: 4.9, trend: 'stable'       },
  LKA: { o: 4.9, a: 4.8, l: 5.0, n: 4.8, g: 5.1, trend: 'improving'    },
  BHR: { o: 4.9, a: 4.8, l: 5.0, n: 4.8, g: 5.2, trend: 'stable'       },
  JAM: { o: 4.9, a: 4.8, l: 5.0, n: 4.8, g: 5.0, trend: 'stable'       },
  TTO: { o: 4.9, a: 4.8, l: 5.0, n: 4.8, g: 5.1, trend: 'stable'       },
  PAN: { o: 4.9, a: 4.8, l: 5.0, n: 4.8, g: 5.0, trend: 'stable'       },
  KAZ: { o: 4.9, a: 4.8, l: 5.0, n: 4.8, g: 5.3, trend: 'stable'       },
  BOL: { o: 4.9, a: 4.8, l: 5.0, n: 4.8, g: 5.1, trend: 'stable'       },
  ECU: { o: 4.9, a: 4.8, l: 5.0, n: 4.8, g: 5.2, trend: 'stable'       },
  PRY: { o: 4.9, a: 4.8, l: 5.0, n: 4.8, g: 5.1, trend: 'stable'       },

  // ── Alto riesgo (5.0–6.9) ────────────────────────────────────────────────────
  TZA: { o: 5.0, a: 4.9, l: 5.1, n: 4.9, g: 5.3, trend: 'stable'       },
  KEN: { o: 5.1, a: 5.0, l: 5.2, n: 5.0, g: 5.4, trend: 'stable'       },
  BRA: { o: 5.2, a: 5.1, l: 5.3, n: 5.1, g: 5.5, trend: 'stable'       },
  PHL: { o: 5.2, a: 5.1, l: 5.3, n: 5.1, g: 5.5, trend: 'stable'       },
  TUN: { o: 5.2, a: 5.1, l: 5.3, n: 5.1, g: 5.4, trend: 'deteriorating'},
  GUY: { o: 5.2, a: 5.1, l: 5.3, n: 5.1, g: 5.3, trend: 'improving'    },
  SUR: { o: 5.3, a: 5.2, l: 5.4, n: 5.2, g: 5.5, trend: 'stable'       },
  DZA: { o: 5.3, a: 5.2, l: 5.4, n: 5.2, g: 5.6, trend: 'stable'       },
  AZE: { o: 5.3, a: 5.2, l: 5.4, n: 5.2, g: 5.8, trend: 'stable'       },
  UZB: { o: 5.4, a: 5.3, l: 5.5, n: 5.3, g: 5.7, trend: 'stable'       },
  COL: { o: 5.4, a: 5.3, l: 5.5, n: 5.3, g: 5.7, trend: 'stable'       },
  EGY: { o: 5.5, a: 5.4, l: 5.6, n: 5.4, g: 5.8, trend: 'deteriorating'},
  BGD: { o: 5.5, a: 5.4, l: 5.6, n: 5.4, g: 5.8, trend: 'stable'       },
  MEX: { o: 5.6, a: 5.5, l: 5.7, n: 5.5, g: 6.0, trend: 'deteriorating'},
  SLV: { o: 5.6, a: 5.5, l: 5.7, n: 5.5, g: 5.8, trend: 'improving'    },
  GAB: { o: 5.6, a: 5.5, l: 5.7, n: 5.5, g: 5.8, trend: 'stable'       },
  MNG: { o: 5.6, a: 5.5, l: 5.7, n: 5.5, g: 5.9, trend: 'stable'       },
  NPL: { o: 5.7, a: 5.6, l: 5.8, n: 5.6, g: 6.0, trend: 'stable'       },
  GTM: { o: 5.7, a: 5.6, l: 5.8, n: 5.6, g: 6.0, trend: 'stable'       },
  UGA: { o: 5.8, a: 5.7, l: 5.9, n: 5.7, g: 6.1, trend: 'stable'       },
  NGA: { o: 5.8, a: 5.7, l: 5.9, n: 5.7, g: 6.2, trend: 'deteriorating'},
  TUR: { o: 5.8, a: 5.7, l: 5.9, n: 5.7, g: 6.2, trend: 'deteriorating'},
  ZMB: { o: 5.9, a: 5.8, l: 6.0, n: 5.8, g: 6.2, trend: 'stable'       },
  HND: { o: 5.9, a: 5.8, l: 6.0, n: 5.8, g: 6.2, trend: 'stable'       },
  ISR: { o: 6.0, a: 5.9, l: 6.1, n: 5.9, g: 7.0, trend: 'deteriorating'},
  AGO: { o: 6.0, a: 5.9, l: 6.1, n: 5.9, g: 6.3, trend: 'stable'       },
  CMR: { o: 6.0, a: 5.9, l: 6.1, n: 5.9, g: 6.4, trend: 'stable'       },
  COG: { o: 6.1, a: 6.0, l: 6.2, n: 6.0, g: 6.4, trend: 'stable'       },
  LAO: { o: 6.2, a: 6.1, l: 6.3, n: 6.1, g: 6.4, trend: 'stable'       },
  NIC: { o: 6.3, a: 6.2, l: 6.4, n: 6.2, g: 6.7, trend: 'stable'       },
  MOZ: { o: 6.3, a: 6.2, l: 6.4, n: 6.2, g: 6.6, trend: 'deteriorating'},
  MDG: { o: 6.3, a: 6.2, l: 6.4, n: 6.2, g: 6.5, trend: 'stable'       },
  KGZ: { o: 6.4, a: 6.3, l: 6.5, n: 6.3, g: 6.7, trend: 'stable'       },
  ARG: { o: 6.5, a: 6.4, l: 6.6, n: 6.4, g: 6.7, trend: 'improving'    },
  TGO: { o: 6.5, a: 6.4, l: 6.6, n: 6.4, g: 6.7, trend: 'stable'       },
  BEN: { o: 6.5, a: 6.4, l: 6.6, n: 6.4, g: 6.7, trend: 'stable'       },
  COD: { o: 6.6, a: 6.5, l: 6.7, n: 6.5, g: 7.0, trend: 'deteriorating'},
  TKM: { o: 6.7, a: 6.6, l: 6.8, n: 6.6, g: 7.0, trend: 'stable'       },
  TJK: { o: 6.7, a: 6.6, l: 6.8, n: 6.6, g: 7.0, trend: 'stable'       },
  GNQ: { o: 6.8, a: 6.7, l: 6.9, n: 6.7, g: 7.1, trend: 'stable'       },
  ZAF: { o: 5.5, a: 5.4, l: 5.6, n: 5.4, g: 5.8, trend: 'deteriorating'},

  // ── Riesgo crítico (7.0–10.0) ────────────────────────────────────────────────
  ZWE: { o: 7.0, a: 6.9, l: 7.1, n: 6.9, g: 7.2, trend: 'stable'       },
  PAK: { o: 7.0, a: 6.9, l: 7.1, n: 6.9, g: 7.4, trend: 'deteriorating'},
  BDI: { o: 7.2, a: 7.1, l: 7.3, n: 7.1, g: 7.4, trend: 'stable'       },
  BFA: { o: 7.2, a: 7.1, l: 7.3, n: 7.1, g: 7.5, trend: 'deteriorating'},
  BLR: { o: 7.3, a: 7.2, l: 7.4, n: 7.2, g: 7.6, trend: 'stable'       },
  LBR: { o: 7.3, a: 7.2, l: 7.4, n: 7.2, g: 7.5, trend: 'stable'       },
  GIN: { o: 7.4, a: 7.3, l: 7.5, n: 7.3, g: 7.6, trend: 'stable'       },
  RUS: { o: 7.5, a: 7.4, l: 7.6, n: 7.4, g: 8.0, trend: 'deteriorating'},
  ERI: { o: 7.5, a: 7.4, l: 7.6, n: 7.4, g: 7.7, trend: 'stable'       },
  MLI: { o: 7.6, a: 7.5, l: 7.7, n: 7.5, g: 7.8, trend: 'deteriorating'},
  NER: { o: 7.6, a: 7.5, l: 7.7, n: 7.5, g: 7.9, trend: 'deteriorating'},
  SLE: { o: 7.6, a: 7.5, l: 7.7, n: 7.5, g: 7.8, trend: 'stable'       },
  IRQ: { o: 7.7, a: 7.6, l: 7.8, n: 7.6, g: 8.0, trend: 'stable'       },
  SDN: { o: 7.8, a: 7.7, l: 7.9, n: 7.7, g: 8.2, trend: 'deteriorating'},
  LBY: { o: 7.8, a: 7.7, l: 7.9, n: 7.7, g: 8.1, trend: 'stable'       },
  UKR: { o: 8.0, a: 7.9, l: 8.1, n: 7.9, g: 8.5, trend: 'deteriorating'},
  MMR: { o: 8.0, a: 7.9, l: 8.1, n: 7.9, g: 8.3, trend: 'deteriorating'},
  LBN: { o: 8.1, a: 8.0, l: 8.2, n: 8.0, g: 8.4, trend: 'deteriorating'},
  ETH: { o: 7.5, a: 7.4, l: 7.6, n: 7.4, g: 8.0, trend: 'deteriorating'},
  VEN: { o: 8.2, a: 8.1, l: 8.3, n: 8.1, g: 8.5, trend: 'stable'       },
  CUB: { o: 7.6, a: 7.5, l: 7.7, n: 7.5, g: 7.9, trend: 'stable'       },
  HTI: { o: 8.5, a: 8.4, l: 8.6, n: 8.4, g: 8.7, trend: 'deteriorating'},
  CAF: { o: 8.6, a: 8.5, l: 8.7, n: 8.5, g: 8.8, trend: 'stable'       },
  IRN: { o: 8.5, a: 8.4, l: 8.6, n: 8.4, g: 8.9, trend: 'stable'       },
  SOM: { o: 9.0, a: 8.9, l: 9.1, n: 8.9, g: 9.2, trend: 'stable'       },
  PRK: { o: 9.1, a: 9.0, l: 9.2, n: 9.0, g: 9.3, trend: 'stable'       },
  SYR: { o: 9.2, a: 9.1, l: 9.3, n: 9.1, g: 9.4, trend: 'stable'       },
  AFG: { o: 9.4, a: 9.3, l: 9.5, n: 9.3, g: 9.6, trend: 'stable'       },
  YEM: { o: 9.5, a: 9.4, l: 9.6, n: 9.4, g: 9.7, trend: 'deteriorating'},
};

function riskLevelFromTrs(trs) {
  if (trs < 4.0) return 'low';
  if (trs < 5.0) return 'medium';
  if (trs < 7.0) return 'high';
  return 'critical';
}

async function seedCountryRiskProfiles(t = null) {
  const now = new Date();
  const txOpt = t ? { transaction: t } : {};

  const rows = countries.map((country) => {
    const trs = TRS_SEED[country.iso3];
    const overall     = trs ? trs.o : 5.50;
    const aduanero    = trs ? trs.a : 5.40;
    const logistico   = trs ? trs.l : 5.60;
    const normativo   = trs ? trs.n : 5.40;
    const geopolitico = trs ? trs.g : 5.70;
    const trend       = trs ? trs.trend : 'stable';

    return {
      isoAlpha3:      country.iso3,
      isoAlpha2:      country.iso2,
      countryName:    country.en,
      countryNameEs:  country.es,
      region:         REGION_MAP[country.iso3] || 'Asia',
      trsOverall:     parseFloat(overall.toFixed(2)),
      trsAduanero:    parseFloat(aduanero.toFixed(2)),
      trsLogistico:   parseFloat(logistico.toFixed(2)),
      trsNormativo:   parseFloat(normativo.toFixed(2)),
      trsGeopolitico: parseFloat(geopolitico.toFixed(2)),
      riskLevel:      riskLevelFromTrs(overall),
      trend,
      updateStatus:   'pending',
      lastUpdatedAt:  now,
      criticalInsight:   null,
      localSourceAlert:  null,
      proRecommendation: null,
      sources:           [],
    };
  });

  // Eliminar registros 'pending' (datos iniciales sin valor real) para re-sembrar
  // con valores TRS realistas. Registros 'completed' (actualizados por el cron) se preservan.
  await CountryRiskProfiles.destroy({ where: { updateStatus: 'pending' }, ...txOpt });

  await CountryRiskProfiles.bulkCreate(rows, {
    ignoreDuplicates: true, // preserva registros 'completed' del cron
    ...txOpt,
  });

  console.log(`  ✓ CountryRiskProfiles: ${rows.length} países sembrados con TRS realistas`);
}

module.exports = { seedCountryRiskProfiles };
