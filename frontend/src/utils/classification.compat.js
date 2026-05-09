/**
 * @description Helper de retrocompatibilidad para resultJson del clasificador.
 *              Permite al frontend renderizar clasificaciones antiguas (legacy)
 *              y nuevas (v2.2) sin crash ni cambios en los componentes legacy.
 */

/**
 * @description Detecta la versión del formato de resultJson almacenado en DB.
 * @param {Object|null} resultJson - Objeto resultJson de una Classification
 * @returns {'v2.2'|'legacy'} Versión detectada del formato
 */
export function detectVersion(resultJson) {
  if (!resultJson) return 'legacy';
  return resultJson.meta?.version === '2.2' ? 'v2.2' : 'legacy';
}

/**
 * @description Extrae el nivel de riesgo desde cualquier versión de mirrorAnalysis.
 * @param {Object|null} mirrorAnalysis
 * @param {string} version - 'v2.2' | 'legacy'
 * @returns {string|null}
 */
export function getRiskLevel(mirrorAnalysis, version) {
  if (!mirrorAnalysis) return null;
  if (version === 'v2.2') return mirrorAnalysis.riskAssessment?.overallLevel || null;
  return mirrorAnalysis.riskAssessment?.level || null;
}

/**
 * @description Extrae documentos de exportación desde cualquier versión de resultJson.
 * @param {Object|null} resultJson
 * @param {string} version
 * @returns {Array}
 */
export function getExportDocuments(resultJson, version) {
  if (!resultJson) return [];
  if (version === 'v2.2') return resultJson.exporter?.exportDocuments || [];
  return resultJson.tariffData?.requiredDocumentsExport || [];
}

/**
 * @description Extrae documentos de importación desde cualquier versión de resultJson.
 * @param {Object|null} resultJson
 * @param {string} version
 * @returns {Array}
 */
export function getImportDocuments(resultJson, version) {
  if (!resultJson) return [];
  if (version === 'v2.2') return resultJson.importer?.importDocuments || [];
  return resultJson.tariffData?.requiredDocumentsImport || [];
}

/**
 * @description Extrae los items del desglose de costos desde cualquier versión.
 * @param {Object|null} resultJson
 * @param {string} version
 * @returns {Array}
 */
export function getCostItems(resultJson, version) {
  if (!resultJson) return [];
  if (version === 'v2.2') return resultJson.costBreakdown?.items || [];
  const costs = resultJson.tariffData?.estimatedCosts;
  if (!costs) return [];
  return [
    costs.customsDuty  && { concept: 'Arancel aduanero',          rate: costs.customsDuty,  source: 'Fuentes oficiales' },
    costs.vat          && { concept: 'IVA / GST importador',       rate: costs.vat,          source: 'Autoridad tributaria' },
    costs.portFees     && { concept: 'Tasas portuarias y logística', rate: costs.portFees,   source: 'Estimación' },
    costs.antidumping  && { concept: 'Antidumping / salvaguardias', rate: costs.antidumping, source: 'Fuentes oficiales' },
  ].filter(Boolean);
}

/**
 * @description Extrae alertas críticas desde cualquier versión de mirrorAnalysis.
 * @param {Object|null} mirrorAnalysis
 * @param {string} version
 * @returns {Array}
 */
export function getCriticalAlerts(mirrorAnalysis, version) {
  if (!mirrorAnalysis) return [];
  if (version === 'v2.2') return mirrorAnalysis.riskAssessment?.criticalAlerts || [];
  return mirrorAnalysis.criticalAlerts || [];
}
