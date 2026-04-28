const { callOpenAI } = require('./openai.service');

/**
 * @description Orquesta el análisis arancelario espejo completo.
 *              Construye el prompt con datos de fuentes ya consultadas y llama
 *              a openai.service.js con gpt-4o. Solo para planes Pro, Team y Enterprise.
 *              El espejo detecta discrepancias entre la nomenclatura arancelaria nacional
 *              del país exportador y la del país importador, anticipando retenciones y multas.
 * @param {string} hsCode - Código HS internacional de 6 dígitos
 * @param {string} productDescription - Descripción confirmada del producto en lenguaje aduanero
 * @param {string} exporterCountry - ISO alpha-3 del país exportador (quien envía)
 * @param {string} importerCountry - ISO alpha-3 del país importador (quien recibe)
 * @param {string|null} hsCodeOrigin - Subpartida nacional del exportador (de tariffData consolidado)
 * @param {string|null} hsCodeDest - Subpartida nacional del importador (de tariffData consolidado)
 * @param {Object|null} tariffData - Datos consolidados de fuentes oficiales para contexto adicional
 * @param {string} language - Código ISO del idioma de respuesta (es/en/pt/fr...)
 * @returns {Promise<object>} Resultado completo del análisis espejo:
 *   concordance, exporterSubheading, importerSubheading, divergences,
 *   riskAssessment, rulesOfOrigin, recommendedSubheading, criticalAlerts
 * @throws {Error} Si OpenAI falla tras los 3 reintentos (se propaga al orquestador)
 */
async function performMirrorAnalysis(
  hsCode,
  productDescription,
  exporterCountry,
  importerCountry,
  hsCodeOrigin,
  hsCodeDest,
  tariffData,
  language,
) {
  const result = await callOpenAI(
    'mirror',
    {
      hsCode,
      productDescription,
      exporterCountry,
      importerCountry,
      // Si las fuentes no devolvieron subpartidas nacionales, indicarlo explícitamente
      // para que gpt-4o las infiera desde su conocimiento del HS y las nomenclaturas locales
      hsCodeOrigin: hsCodeOrigin || 'Por determinar — inferir desde HS internacional',
      hsCodeDest: hsCodeDest || 'Por determinar — inferir desde HS internacional',
      tariffData: tariffData || {},
    },
    language,
  );

  return result;
}

module.exports = { performMirrorAnalysis };
