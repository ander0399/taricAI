/**
 * @description Validador de completitud y consistencia del JSON devuelto por la IA.
 *              Verifica que campos críticos no estén vacíos, que no haya contradicciones
 *              internas y que los tributos tengan al menos arancel NMF + IVA del importador.
 *              Si la validación falla, retorna los campos faltantes para reintento con
 *              prompt reforzado (Sección 7.6).
 */

const AI_VALIDATION_ENABLED = process.env.AI_VALIDATION_ENABLED !== 'false';

/**
 * @description Parsea de forma segura la respuesta de la IA.
 *              Maneja JSON malformado, markdown envuelto (```json...```) y respuestas truncadas.
 * @param {string|Object} rawResponse - Respuesta cruda de OpenAI (ya parseada por callOpenAI)
 * @returns {Object|null} Objeto parseado o null si es irrecuperable
 * @throws {502} Si la respuesta de OpenAI es completamente vacía o inválida
 */
function safeParseAIResponse(rawResponse) {
  if (!rawResponse) return null;
  if (typeof rawResponse === 'object') return rawResponse;

  let cleaned = rawResponse.trim();
  // Quitar bloques markdown si la IA los incluyó a pesar de las instrucciones
  cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    // Intentar reparar JSON truncado (añadir cierre de llaves faltantes)
    try {
      const openBraces  = (cleaned.match(/{/g) || []).length;
      const closeBraces = (cleaned.match(/}/g) || []).length;
      const missing = openBraces - closeBraces;
      if (missing > 0) {
        return JSON.parse(cleaned + '}'.repeat(missing));
      }
    } catch { /* irrecuperable */ }
    return null;
  }
}

/**
 * @description Verifica si un valor está efectivamente vacío (null, undefined, "···", "N/A").
 * @param {*} value
 * @returns {boolean}
 */
function isEmpty(value) {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed === '' || trimmed === '···' || trimmed === 'N/A' || trimmed === 'null';
  }
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

/**
 * @description Valida la completitud y consistencia del JSON devuelto por la IA.
 *              Devuelve lista de campos faltantes para el prompt de refuerzo.
 *
 * @param {{ resultJson: Object, mirrorAnalysis: Object|null }} aiResponse
 * @param {string} exporterCode - ISO alpha-3 del país exportador
 * @param {string} importerCode - ISO alpha-3 del país importador
 * @returns {{ valid: boolean, missingFields: string[], contradictions: string[] }}
 * @throws {400} Si el JSON es irrecuperable (sintaxis inválida)
 */
function validateAIResponse(aiResponse, exporterCode, importerCode) {
  if (!AI_VALIDATION_ENABLED) {
    return { valid: true, missingFields: [], contradictions: [] };
  }

  const missingFields  = [];
  const contradictions = [];

  const rj = aiResponse?.resultJson;
  const ma = aiResponse?.mirrorAnalysis;

  if (!rj) {
    return { valid: false, missingFields: ['resultJson (campo raíz faltante)'], contradictions: [] };
  }

  // ── Validar campos críticos de resultJson ──────────────────────────────────

  // product
  if (isEmpty(rj.product?.hsCodeInternational)) missingFields.push('resultJson.product.hsCodeInternational');
  if (isEmpty(rj.product?.description))         missingFields.push('resultJson.product.description');

  // exporter
  if (isEmpty(rj.exporter?.nationalSubheading)) missingFields.push('resultJson.exporter.nationalSubheading (subpartida nacional del exportador)');
  if (isEmpty(rj.exporter?.exportDuties?.exportTariffRate)) missingFields.push('resultJson.exporter.exportDuties.exportTariffRate');

  const exportDocs = rj.exporter?.exportDocuments || [];
  if (exportDocs.length < 3) {
    missingFields.push(`resultJson.exporter.exportDocuments (tiene ${exportDocs.length}, mínimo 3 documentos obligatorios)`);
  }

  // importer
  if (isEmpty(rj.importer?.nationalSubheading)) missingFields.push('resultJson.importer.nationalSubheading (subpartida nacional del importador)');
  if (isEmpty(rj.importer?.importDuties?.mfnTariffRate)) missingFields.push('resultJson.importer.importDuties.mfnTariffRate (arancel NMF obligatorio)');
  if (isEmpty(rj.importer?.importDuties?.importVAT))    missingFields.push(`resultJson.importer.importDuties.importVAT (IVA/GST del importador ${importerCode} obligatorio)`);

  const importDocs = rj.importer?.importDocuments || [];
  if (importDocs.length < 3) {
    missingFields.push(`resultJson.importer.importDocuments (tiene ${importDocs.length}, mínimo 3 documentos obligatorios)`);
  }

  // tradeAgreements
  if (typeof rj.tradeAgreements?.hasPreferentialAgreement !== 'boolean') {
    missingFields.push('resultJson.tradeAgreements.hasPreferentialAgreement (debe ser boolean, no string)');
  }

  // costBreakdown
  const costItems = rj.costBreakdown?.items || [];
  if (costItems.length < 2) {
    missingFields.push(`resultJson.costBreakdown.items (tiene ${costItems.length}, mínimo 2 items con rate real)`);
  } else {
    const allRatesEmpty = costItems.every((item) => isEmpty(item.rate));
    if (allRatesEmpty) missingFields.push('resultJson.costBreakdown.items — todos los items tienen rate vacío, se requieren tasas reales');
  }

  // ── Verificar contradicciones internas ────────────────────────────────────
  if (rj.tradeAgreements?.hasPreferentialAgreement === false) {
    if (ma?.rulesOfOrigin?.agreementApplies === true) {
      contradictions.push('tradeAgreements.hasPreferentialAgreement=false pero mirrorAnalysis.rulesOfOrigin.agreementApplies=true');
    }
    if (!isEmpty(rj.importer?.importDuties?.preferentialTariffRate)) {
      contradictions.push('tradeAgreements.hasPreferentialAgreement=false pero importer.importDuties.preferentialTariffRate tiene valor');
    }
  }

  return {
    valid:        missingFields.length === 0 && contradictions.length === 0,
    missingFields,
    contradictions,
  };
}

module.exports = { validateAIResponse, safeParseAIResponse, isEmpty };
