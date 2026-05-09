/**
 * @description Base de datos de acuerdos comerciales verificados y falsos positivos conocidos.
 *              Usada por agreement.validator.js para corregir respuestas de la IA que inventa
 *              acuerdos inexistentes o reporta acuerdos en negociación como vigentes.
 *
 * FALSOS POSITIVOS: acuerdos que la IA tiende a inventar con frecuencia.
 * ACUERDOS VERIFICADOS: lista de referencia (NO exhaustiva — verificar en WTO RTA Database).
 */

/**
 * Pares de países para los que la IA frecuentemente inventa acuerdos.
 * Formato: Set de strings "XXX-YYY" (siempre en orden alfabético).
 */
const FALSE_POSITIVE_PAIRS = new Set([
  'CHN-EUR', 'CHN-ESP', 'CHN-DEU', 'CHN-FRA', 'CHN-ITA', 'CHN-NLD',
  'CHN-GBR', 'RUS-USA', 'RUS-EUR', 'RUS-ESP', 'IND-EUR', 'IND-GBR',
  'CHN-USA', // Existe Section 301 tariffs y tensiones — NO hay TLC
]);

/**
 * Acuerdos verificados con metadatos.
 * status: 'vigente' | 'provisional' | 'en_negociacion' | 'firmado_no_ratificado' | 'suspendido'
 * type: 'fta' | 'customs_union' | 'epa' | 'partial' | 'rta'
 */
const VERIFIED_AGREEMENTS = [
  // ── USMCA / T-MEC ──────────────────────────────────────────────────────────
  { parties: ['USA', 'MEX', 'CAN'], name: 'USMCA / T-MEC', status: 'vigente', since: '2020', type: 'fta' },

  // ── Unión Europea ──────────────────────────────────────────────────────────
  { parties: ['EUR', 'KOR'], name: 'EU-Korea FTA', status: 'vigente', since: '2011', type: 'fta' },
  { parties: ['EUR', 'JPN'], name: 'EU-Japan EPA', status: 'vigente', since: '2019', type: 'epa' },
  { parties: ['EUR', 'CAN'], name: 'CETA', status: 'provisional', since: '2017', type: 'fta' },
  { parties: ['EUR', 'SGP'], name: 'EU-Singapore FTA', status: 'vigente', since: '2019', type: 'fta' },
  { parties: ['EUR', 'VNM'], name: 'EU-Vietnam FTA', status: 'vigente', since: '2020', type: 'fta' },
  { parties: ['EUR', 'GBR'], name: 'EU-UK Trade and Cooperation Agreement (TCA)', status: 'vigente', since: '2021', type: 'fta' },
  { parties: ['EUR', 'MEX'], name: 'EU-Mexico Global Agreement (updated)', status: 'provisional', since: '2000', type: 'fta' },
  { parties: ['EUR', 'CHL'], name: 'EU-Chile Association Agreement', status: 'vigente', since: '2003', type: 'fta' },
  { parties: ['EUR', 'COL'], name: 'EU-Colombia/Peru/Ecuador Trade Agreement', status: 'vigente', since: '2013', type: 'fta' },
  { parties: ['EUR', 'PER'], name: 'EU-Colombia/Peru/Ecuador Trade Agreement', status: 'vigente', since: '2013', type: 'fta' },
  { parties: ['EUR', 'ECU'], name: 'EU-Colombia/Peru/Ecuador Trade Agreement', status: 'vigente', since: '2017', type: 'fta' },
  { parties: ['EUR', 'TUR'], name: 'EU-Turkey Customs Union', status: 'vigente', since: '1996', type: 'customs_union' },
  { parties: ['EUR', 'ZAF'], name: 'EU-South Africa EPA (SADC)', status: 'vigente', since: '2016', type: 'epa' },
  { parties: ['EUR', 'BRA'], name: 'EU-Mercosur Agreement', status: 'firmado_no_ratificado', note: 'Firmado en 2019, no ratificado a 2026', type: 'fta' },
  { parties: ['EUR', 'ARG'], name: 'EU-Mercosur Agreement', status: 'firmado_no_ratificado', note: 'Firmado en 2019, no ratificado a 2026', type: 'fta' },
  { parties: ['EUR', 'URY'], name: 'EU-Mercosur Agreement', status: 'firmado_no_ratificado', note: 'Firmado en 2019, no ratificado a 2026', type: 'fta' },
  { parties: ['EUR', 'PRY'], name: 'EU-Mercosur Agreement', status: 'firmado_no_ratificado', note: 'Firmado en 2019, no ratificado a 2026', type: 'fta' },
  { parties: ['EUR', 'ISR'], name: 'EU-Israel Association Agreement', status: 'vigente', since: '2000', type: 'fta' },
  { parties: ['EUR', 'MAR'], name: 'EU-Morocco Association Agreement', status: 'vigente', since: '2000', type: 'fta' },
  { parties: ['EUR', 'IND'], name: 'EU-India FTA', status: 'en_negociacion', note: 'En negociación — NO vigente a 2026', type: 'fta' },

  // ── Asia-Pacífico ──────────────────────────────────────────────────────────
  { parties: ['CHN', 'JPN', 'KOR', 'AUS', 'NZL'], name: 'RCEP', status: 'vigente', since: '2022', type: 'fta' },
  { parties: ['JPN', 'AUS', 'NZL', 'CAN', 'MEX', 'PER', 'CHL', 'SGP', 'VNM', 'MYS', 'BRN'], name: 'CPTPP', status: 'vigente', since: '2018', type: 'fta' },
  { parties: ['USA', 'KOR'], name: 'KORUS FTA', status: 'vigente', since: '2012', type: 'fta' },
  { parties: ['USA', 'AUS'], name: 'AUSFTA', status: 'vigente', since: '2005', type: 'fta' },
  { parties: ['USA', 'SGP'], name: 'US-Singapore FTA', status: 'vigente', since: '2004', type: 'fta' },
  { parties: ['USA', 'JPN'], name: 'US-Japan Trade Agreement', status: 'vigente', since: '2020', type: 'partial' },
  { parties: ['CHN', 'AUS'], name: 'ChAFTA', status: 'vigente', since: '2015', type: 'fta' },
  { parties: ['CHN', 'NZL'], name: 'China-New Zealand FTA', status: 'vigente', since: '2008', type: 'fta' },
  { parties: ['CHN', 'ASEAN'], name: 'ACFTA (China-ASEAN)', status: 'vigente', since: '2005', type: 'fta' },

  // ── América Latina ─────────────────────────────────────────────────────────
  { parties: ['COL', 'USA'], name: 'US-Colombia TPA', status: 'vigente', since: '2012', type: 'fta' },
  { parties: ['PER', 'USA'], name: 'US-Peru TPA', status: 'vigente', since: '2009', type: 'fta' },
  { parties: ['CHL', 'USA'], name: 'US-Chile FTA', status: 'vigente', since: '2004', type: 'fta' },
  { parties: ['COL', 'CHL', 'MEX', 'PER'], name: 'Alianza del Pacífico', status: 'vigente', since: '2016', type: 'fta' },
  { parties: ['BRA', 'ARG', 'URY', 'PRY'], name: 'MERCOSUR', status: 'vigente', since: '1991', type: 'customs_union' },

  // ── África ────────────────────────────────────────────────────────────────
  { parties: ['AfCFTA'], name: 'African Continental Free Trade Area (AfCFTA)', status: 'vigente', since: '2021', type: 'fta' },
];

/**
 * @description Normaliza un par de países a clave canónica (orden alfabético).
 * @param {string} a - ISO alpha-3
 * @param {string} b - ISO alpha-3
 * @returns {string}
 */
function makePairKey(a, b) {
  return [a, b].sort().join('-');
}

/**
 * @description Verifica si un par de países tiene acuerdo falso positivo conocido.
 * @param {string} exporterCode - ISO alpha-3
 * @param {string} importerCode - ISO alpha-3
 * @returns {boolean}
 */
function isFalsePositivePair(exporterCode, importerCode) {
  const key = makePairKey(exporterCode, importerCode);
  // También verificar contra código EU genérico para países UE
  const EU_CODES = new Set(['ESP', 'DEU', 'FRA', 'ITA', 'NLD', 'BEL', 'PRT', 'GRC', 'AUT', 'SWE', 'FIN', 'DNK', 'IRL', 'POL', 'CZE', 'HUN', 'ROU', 'BGR', 'HRV', 'SVK', 'SVN', 'LTU', 'LVA', 'EST', 'LUX', 'CYP', 'MLT']);

  if (FALSE_POSITIVE_PAIRS.has(key)) return true;

  if (EU_CODES.has(exporterCode) && FALSE_POSITIVE_PAIRS.has(makePairKey('EUR', importerCode))) return true;
  if (EU_CODES.has(importerCode) && FALSE_POSITIVE_PAIRS.has(makePairKey(exporterCode, 'EUR'))) return true;

  return false;
}

/**
 * @description Busca un acuerdo verificado entre dos países.
 *              Soporta búsqueda bidireccional y por bloques comerciales (UE).
 * @param {string} exporterCode - ISO alpha-3
 * @param {string} importerCode - ISO alpha-3
 * @returns {{ agreementName: string, status: string, type: string, note?: string } | null}
 */
function lookupKnownAgreement(exporterCode, importerCode) {
  const EU_MEMBERS = new Set(['ESP', 'DEU', 'FRA', 'ITA', 'NLD', 'BEL', 'PRT', 'GRC', 'AUT', 'SWE', 'FIN', 'DNK', 'IRL', 'POL', 'CZE', 'HUN', 'ROU', 'BGR', 'HRV', 'SVK', 'SVN', 'LTU', 'LVA', 'EST', 'LUX', 'CYP', 'MLT']);

  const exporterSearch = EU_MEMBERS.has(exporterCode) ? [exporterCode, 'EUR'] : [exporterCode];
  const importerSearch = EU_MEMBERS.has(importerCode) ? [importerCode, 'EUR'] : [importerCode];

  for (const agreement of VERIFIED_AGREEMENTS) {
    const parties = agreement.parties;
    for (const exp of exporterSearch) {
      for (const imp of importerSearch) {
        if (parties.includes(exp) && parties.includes(imp) && exp !== imp) {
          return {
            agreementName: agreement.name,
            status:        agreement.status,
            type:          agreement.type,
            note:          agreement.note || null,
          };
        }
      }
    }
  }
  return null;
}

module.exports = { isFalsePositivePair, lookupKnownAgreement, VERIFIED_AGREEMENTS, FALSE_POSITIVE_PAIRS };
