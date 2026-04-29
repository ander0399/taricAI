const { ClassificationSources } = require('../../src/models');
const { CLASSIFICATIONS } = require('../data/classifications.data');

/**
 * @description Fuentes oficiales por país (ISO alpha-3).
 * 'MUL' = multilateral (WCO, WTO, ITC).
 */
const SOURCES_BY_COUNTRY = {
  COL: { sourceName: 'DIAN MUISCA',          sourceUrl: 'https://muisca.dian.gov.co/WebArancel',                                                      countryCode: 'COL' },
  USA: { sourceName: 'CBP HTS Online',        sourceUrl: 'https://hts.usitc.gov',                                                                       countryCode: 'USA' },
  MEX: { sourceName: 'SAT TIGIE',             sourceUrl: 'https://www.sat.gob.mx/aduanas/tigie',                                                         countryCode: 'MEX' },
  DEU: { sourceName: 'EU TARIC',              sourceUrl: 'https://ec.europa.eu/taxation_customs/dds2/taric',                                             countryCode: 'DEU' },
  FRA: { sourceName: 'EU TARIC',              sourceUrl: 'https://ec.europa.eu/taxation_customs/dds2/taric',                                             countryCode: 'FRA' },
  ESP: { sourceName: 'EU TARIC',              sourceUrl: 'https://ec.europa.eu/taxation_customs/dds2/taric',                                             countryCode: 'ESP' },
  ITA: { sourceName: 'EU TARIC',              sourceUrl: 'https://ec.europa.eu/taxation_customs/dds2/taric',                                             countryCode: 'ITA' },
  NLD: { sourceName: 'EU TARIC',              sourceUrl: 'https://ec.europa.eu/taxation_customs/dds2/taric',                                             countryCode: 'NLD' },
  BEL: { sourceName: 'EU TARIC',              sourceUrl: 'https://ec.europa.eu/taxation_customs/dds2/taric',                                             countryCode: 'BEL' },
  POL: { sourceName: 'EU TARIC',              sourceUrl: 'https://ec.europa.eu/taxation_customs/dds2/taric',                                             countryCode: 'POL' },
  CZE: { sourceName: 'EU TARIC',              sourceUrl: 'https://ec.europa.eu/taxation_customs/dds2/taric',                                             countryCode: 'CZE' },
  BRA: { sourceName: 'Receita Federal NCM',   sourceUrl: 'https://www.gov.br/receitafederal/pt-br/assuntos/aduana-e-comercio-exterior',                  countryCode: 'BRA' },
  CHN: { sourceName: 'GACC China',            sourceUrl: 'http://www.customs.gov.cn',                                                                    countryCode: 'CHN' },
  JPN: { sourceName: 'Japan Customs',         sourceUrl: 'https://www.customs.go.jp/tariff',                                                             countryCode: 'JPN' },
  KOR: { sourceName: 'Korea Customs Service', sourceUrl: 'https://unipass.customs.go.kr',                                                                countryCode: 'KOR' },
  IND: { sourceName: 'DGFT India',            sourceUrl: 'https://www.dgft.gov.in',                                                                      countryCode: 'IND' },
  ARG: { sourceName: 'AFIP Aduanas',          sourceUrl: 'https://www.afip.gob.ar/aduana',                                                               countryCode: 'ARG' },
  CHL: { sourceName: 'Aduana Chile SNA',      sourceUrl: 'https://www.aduana.cl',                                                                        countryCode: 'CHL' },
  PER: { sourceName: 'SUNAT Aduanas',         sourceUrl: 'https://www.sunat.gob.pe',                                                                     countryCode: 'PER' },
  ECU: { sourceName: 'SENAE Ecuador',         sourceUrl: 'https://www.aduana.gob.ec',                                                                    countryCode: 'ECU' },
  TUR: { sourceName: 'Turkish Customs',       sourceUrl: 'https://www.gumrukrehberi.gov.tr',                                                             countryCode: 'TUR' },
  SGP: { sourceName: 'Singapore Customs',     sourceUrl: 'https://www.customs.gov.sg',                                                                   countryCode: 'SGP' },
  GBR: { sourceName: 'UK Global Tariff',      sourceUrl: 'https://www.trade-tariff.service.gov.uk',                                                      countryCode: 'GBR' },
  CAN: { sourceName: 'CBSA Canada',           sourceUrl: 'https://www.cbsa-asfc.gc.ca',                                                                  countryCode: 'CAN' },
  NOR: { sourceName: 'Tollvesenet Norway',    sourceUrl: 'https://www.toll.no',                                                                          countryCode: 'NOR' },
  AUS: { sourceName: 'ABF Australia',         sourceUrl: 'https://www.abf.gov.au',                                                                       countryCode: 'AUS' },
  TWN: { sourceName: 'Taiwan Customs',        sourceUrl: 'https://web.customs.gov.tw',                                                                   countryCode: 'TWN' },
  THA: { sourceName: 'Thai Customs',          sourceUrl: 'https://www.customs.go.th',                                                                    countryCode: 'THA' },
  VNM: { sourceName: 'Vietnam Customs',       sourceUrl: 'https://www.customs.gov.vn',                                                                   countryCode: 'VNM' },
  BGD: { sourceName: 'NBR Bangladesh',        sourceUrl: 'https://nbr.gov.bd',                                                                           countryCode: 'BGD' },
  MAR: { sourceName: 'ADII Maroc',            sourceUrl: 'https://www.douane.gov.ma',                                                                    countryCode: 'MAR' },
  RUS: { sourceName: 'FCS Russia',            sourceUrl: 'https://www.customs.gov.ru',                                                                   countryCode: 'RUS' },
  CHE: { sourceName: 'Swiss Customs',         sourceUrl: 'https://www.bazg.admin.ch',                                                                    countryCode: 'CHE' },
  FIN: { sourceName: 'EU TARIC',              sourceUrl: 'https://ec.europa.eu/taxation_customs/dds2/taric',                                             countryCode: 'FIN' },
};

const WCO = { sourceName: 'WCO HS Database',    sourceUrl: 'https://www.wcoomd.org/hs-nomenclature-2022-edition.aspx', countryCode: 'MUL' };
const ITC = { sourceName: 'ITC Market Access Map', sourceUrl: 'https://www.macmap.org',                                  countryCode: 'MUL' };
const WTO = { sourceName: 'WTO Tariff Download', sourceUrl: 'https://tariffdata.wto.org',                               countryCode: 'MUL' };

/**
 * @description Genera 2-3 fuentes por clasificación según países de origen y destino.
 * Incluye ocasionalmente responseStatus:'timeout' en 1 de cada 10 fuentes nacionales.
 *
 * @param {object} classification
 * @param {number} index - Índice global para determinar el timeout ocasional
 * @returns {Array<object>}
 */
function buildSources(classification, index) {
  const { id: classificationId, originCountry, destCountry } = classification;
  const now = new Date();

  const makeSource = (template, forceTimeout = false) => ({
    classificationId,
    sourceName: template.sourceName,
    sourceUrl: template.sourceUrl,
    countryCode: template.countryCode,
    responseStatus: forceTimeout ? 'timeout' : 'ok',
    fetchedAt: now,
  });

  const sources = [];

  // Fuente 1: país exportador
  const originSource = SOURCES_BY_COUNTRY[originCountry];
  if (originSource) {
    sources.push(makeSource(originSource));
  }

  // Fuente 2: país importador (con timeout ocasional — 1 de cada 10)
  const destSource = SOURCES_BY_COUNTRY[destCountry];
  if (destSource) {
    const isTimeout = index % 10 === 7; // ocasional, nunca en multilaterales
    sources.push(makeSource(destSource, isTimeout));
  }

  // Fuente 3: multilateral (WCO, ITC o WTO rotando)
  const multilaterals = [WCO, ITC, WTO];
  sources.push(makeSource(multilaterals[index % 3]));

  return sources;
}

/**
 * @description Inserta fuentes oficiales para todas las clasificaciones del seed.
 * Genera 2-3 fuentes por clasificación = ~380 registros en total.
 *
 * @param {import('sequelize').Transaction} t
 * @returns {Promise<void>}
 */
async function seedClassificationSources(t) {
  const allSources = CLASSIFICATIONS.flatMap((c, i) => buildSources(c, i));

  await ClassificationSources.bulkCreate(allSources, {
    transaction: t,
    ignoreDuplicates: true,
  });
  console.log(`  ✓ ClassificationSources: ${allSources.length} registros insertados`);
}

module.exports = { seedClassificationSources };
