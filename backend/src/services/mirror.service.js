const { callOpenAI } = require('./openai.service');

/**
 * @description Orquesta el análisis arancelario espejo completo v2.2.
 *              Produce en una sola llamada a gpt-4o TANTO el resultJson v2.2
 *              (con datos de exporter, importer, tradeAgreements, costBreakdown)
 *              COMO el mirrorAnalysis v2.2 (con taxComparison, documentComparison,
 *              ntbComparison, riskAssessment). Solo para planes Pro, Team y Enterprise.
 *
 * @param {string} hsCode              - Código HS internacional de 6 dígitos
 * @param {string} productDescription  - Descripción confirmada del producto
 * @param {string} exporterCountry     - ISO alpha-3 del país exportador
 * @param {string} importerCountry     - ISO alpha-3 del país importador
 * @param {number} confidence          - Confianza de la clasificación HS (0-100)
 * @param {string} inputType           - 'text' | 'image' | 'ocr'
 * @param {Object|null} consolidatedSources - Datos consolidados de fuentes oficiales
 * @param {string} language            - Código ISO del idioma de respuesta
 * @returns {Promise<{ resultJson: Object, mirrorAnalysis: Object }>} Estructuras v2.2 completas
 * @throws {Error} Si OpenAI falla tras los 3 reintentos
 */
async function performMirrorAnalysis(
  hsCode,
  productDescription,
  exporterCountry,
  importerCountry,
  confidence,
  inputType,
  consolidatedSources,
  language,
) {
  const result = await callOpenAI(
    'mirror',
    {
      productDescription,
      primaryHsCode:      hsCode,
      confidence:         confidence || 0,
      exporterCountry,
      importerCountry,
      inputType:          inputType || 'text',
      officialSourcesData: consolidatedSources || {},
    },
    language,
  );

  // La respuesta tiene estructura raíz { resultJson, mirrorAnalysis }
  return {
    resultJson:     result.resultJson     || null,
    mirrorAnalysis: result.mirrorAnalysis || null,
  };
}

module.exports = { performMirrorAnalysis };
