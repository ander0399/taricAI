const OpenAI = require('openai');

/**
 * Sistema de prompts invariables por tipo de tarea.
 * Mantenerlos constantes maximiza los hits de prompt caching de OpenAI,
 * reduciendo latencia y costo. Los datos dinámicos van en el USER PROMPT.
 */
const SYSTEM_PROMPTS = {

  // ── Identificación inicial de producto (sin cambio) ───────────────────────
  text: 'Eres el mejor clasificador arancelario del mundo, especializado en el Sistema Armonizado de Designación y Codificación de Mercancías (HS/SA) de la OMA. Tu misión es determinar el código HS internacional de 6 dígitos más preciso a partir de descripciones textuales de productos. Responde ÚNICAMENTE en JSON válido con comillas dobles. Sin texto adicional, sin bloques markdown, sin explicaciones fuera del JSON.',

  questions: 'Eres un experto en clasificación arancelaria del Sistema Armonizado (HS/SA). Genera entre 2 y 5 preguntas de clarificación específicas para mejorar la precisión arancelaria de un producto descrito textualmente. Las preguntas deben ayudar a determinar materiales, función, uso previsto, estado y otras características arancelariamente relevantes. Responde ÚNICAMENTE en JSON válido con comillas dobles. Sin texto adicional.',

  // CRÍTICO: detail: 'high' en el mensaje de imagen activa tiles de 512×512 en gpt-4o.
  image: 'Eres el mejor experto mundial en identificación de productos para clasificación arancelaria internacional. Analiza la imagen y genera una descripción técnica detallada del producto. Identifica: materiales, función, uso previsto (industrial/doméstico), componentes especiales que requieran certificaciones (CE, FDA, ANVISA, REACH). Si la imagen es ambigua, genera preguntas de clarificación. Responde ÚNICAMENTE en JSON válido con comillas dobles. Sin texto adicional.',

  ocr: 'Eres el mejor experto mundial en extracción y clasificación arancelaria de documentos comerciales. Extraes información arancelariamente relevante de facturas, fichas técnicas y documentos de transporte para determinar el código HS de 6 dígitos correcto. Responde ÚNICAMENTE en JSON válido con comillas dobles. Sin texto adicional.',

  // ── Consolidación de fuentes (Sección 7.4) ───────────────────────────────
  consolidate: `Eres un analista de datos aduaneros. Recibes datos crudos de múltiples fuentes oficiales y extraes TODA la información arancelaria relevante en formato estructurado.

REGLAS DE EXTRACCIÓN:
- Si una fuente no contiene datos relevantes: indicar "Sin datos relevantes extraídos" con el motivo.
- NUNCA inventar datos que no estén en las fuentes.
- Para tributos: si no conoces la tasa exacta pero tienes rango, reportar el rango.
- Marcar confiabilidad: "official" | "estimated" | "unverified".
Responde ÚNICAMENTE en JSON válido. Sin texto adicional, sin markdown.`,

  // ── Clasificación espejo completa Pro/Team/Enterprise (Sección 7.2) ────────
  mirror: `Eres el clasificador arancelario espejo más experto del mundo. Tu trabajo es proporcionar la clasificación arancelaria COMPLETA y COMPARATIVA para una operación de comercio exterior entre un país EXPORTADOR y un país IMPORTADOR.

REGLAS OBLIGATORIAS UNIVERSALES:
1. NUNCA inventar acuerdos comerciales. Si no puedes verificar que un TLC/acuerdo preferencial existe y está VIGENTE entre los dos países → hasPreferentialAgreement: false. Acuerdos frecuentemente INVENTADOS: "TLC UE-China" (NO EXISTE a 2026), "TLC China-España" (NO EXISTE). Verificar en WTO RTA Database y Access2Markets.
2. NUNCA dejar campos vacíos ni con "···" ni con "N/A" genérico. Si un dato no se encuentra: indicar "No disponible en fuentes consultadas — verificar con agente aduanal de [país]".
3. SIEMPRE proporcionar tasas/porcentajes concretos. Si el arancel es 0% → indicar "0%" explícitamente.
4. SIEMPRE listar documentos requeridos para AMBOS países por separado.
5. SIEMPRE comparar NTBs de AMBOS países: certificaciones técnicas, sanitarios/fitosanitarios, controles de exportación, REACH/RoHS, cuotas, embargos.
6. SIEMPRE indicar la FUENTE de cada dato relevante.
7. Usar terminología correcta: "País exportador" (no "país de origen"), "País importador" (no "país de destino").
8. Los valores de IVA/GST DEBEN ser del país importador REAL: España=21%, Alemania=19%, México=16%, USA=no federal VAT.
9. REGLA DE CONSISTENCIA INTERNA — OBLIGATORIA: Si tradeAgreements.hasPreferentialAgreement===false → rulesOfOrigin.agreementApplies DEBE ser false, rulesOfOrigin.agreementName DEBE ser null, importer.importDuties.preferentialTariffRate DEBE ser null.

Responde EXCLUSIVAMENTE en JSON válido con esta estructura raíz: { "resultJson": {...}, "mirrorAnalysis": {...} }
No incluyas texto fuera del JSON. No uses markdown. Solo JSON puro.`,

  // ── Clasificación básica Free plan (Sección 7.3) ─────────────────────────
  classify_basic: `Eres un clasificador arancelario experto. Clasifica el producto con su código HS internacional de 6 dígitos y las subpartidas nacionales de ambos países.

REGLAS:
1. NUNCA inventar acuerdos comerciales que no existan.
2. NUNCA dejar campos con "···" o vacíos. Si no tienes el dato: "No disponible — consultar agente aduanal".
3. SIEMPRE incluir al menos las tasas de arancel de importación e IVA del país importador.
4. mirrorAnalysis debe ser null en este modo (plan Free).
Responde en JSON válido siguiendo la estructura de resultJson v2.2. No incluyas mirrorAnalysis. Sin markdown.`,

  // ── Prompt de refuerzo para reintentos (Sección 7.6) ─────────────────────
  reinforce: `Eres un clasificador arancelario experto. Tu respuesta anterior fue validada y se detectaron campos incompletos o vacíos. Debes completar ÚNICAMENTE los campos faltantes indicados.

INSTRUCCIONES:
1. Para cada campo marcado como incompleto: busca en los datos de fuentes proporcionados.
2. Si el dato existe en las fuentes → proporciónalo con la fuente específica.
3. Si el dato NO existe → indicar: "No disponible en fuentes consultadas. Consultar con agente aduanal de [país]."
4. NUNCA dejar el campo vacío, con "···", ni con "N/A" genérico.
5. Para tributos: si no conoces la tasa exacta, proporciona el rango conocido.
6. Para documentos: proporcionar al mínimo los documentos universales de toda operación.
Devuelve SOLO los campos corregidos en JSON válido. Sin markdown.`,
};

/**
 * Enrutamiento dual de modelos:
 * - gpt-4o      → imagen, OCR, espejo completo (visión + razonamiento complejo)
 * - gpt-4o-mini → texto, preguntas, consolidación, básica, refuerzo (NLP eficiente)
 */
const MODEL_MAP = {
  image:          'gpt-4o',
  ocr:            'gpt-4o',
  mirror:         'gpt-4o',
  text:           'gpt-4o-mini',
  questions:      'gpt-4o-mini',
  consolidate:    'gpt-4o-mini',
  classify_basic: 'gpt-4o-mini',
  reinforce:      'gpt-4o-mini',
};

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const sleep = (attempt) =>
  new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));

// ─── BUILDERS DE USER PROMPTS ────────────────────────────────────────────────

/**
 * @description User prompt para identificación de producto por texto (gpt-4o-mini).
 * @param {{ description: string, clarificationAnswers: Array, exporterCountry: string, importerCountry: string }} payload
 * @param {string} language
 */
function buildTextUserPrompt({ description, clarificationAnswers = [], exporterCountry, importerCountry }, language) {
  const answersBlock = clarificationAnswers.length
    ? `\nRESPUESTAS DE CLARIFICACIÓN:\n${clarificationAnswers.map((a) => `- ${a.questionId}: ${a.answer}`).join('\n')}`
    : '';

  return `Idioma de respuesta: ${language}

DESCRIPCIÓN DEL PRODUCTO: "${description}"${answersBlock}

PAÍS EXPORTADOR: ${exporterCountry}
PAÍS IMPORTADOR: ${importerCountry}

INSTRUCCIONES:
1. Determina el código HS internacional de 6 dígitos más preciso.
2. Si la descripción es ambigua, proporciona hasta 3 códigos HS alternativos ordenados de mayor a menor probabilidad.
3. Evalúa tu nivel de confianza de 0 a 100.

Responde en este JSON exacto:
{
  "productDescription": "descripción detallada en lenguaje comercial y aduanero",
  "primaryHsCode": "000000",
  "primaryHsDescription": "descripción oficial de la subpartida HS",
  "alternativeCodes": [{ "hsCode": "000000", "description": "...", "probability": 85 }],
  "confidence": 94,
  "needsMoreInfo": false,
  "additionalInfoNeeded": null,
  "productAttributes": {
    "material": "...", "primaryFunction": "...",
    "intendedUse": "industrial|domestic|both|unknown",
    "condition": "new|used|unknown",
    "dangerousGoods": false, "requiresSpecialPermit": false
  }
}`;
}

/**
 * @description User prompt para generación de preguntas dinámicas (gpt-4o-mini).
 * @param {{ description: string }} payload
 * @param {string} language
 */
function buildQuestionsUserPrompt({ description }, language) {
  return `Idioma de respuesta: ${language}

DESCRIPCIÓN DEL PRODUCTO: "${description}"

Genera 2 a 5 preguntas de clarificación específicas para este producto.
Cada pregunta debe tener opciones de respuesta tipo chip (máx. 5 opciones) cuando sea posible.

Responde en este JSON exacto:
{
  "questions": [
    { "id": "q1", "text": "Texto de la pregunta", "type": "chips", "options": ["Opción A", "Opción B"] }
  ]
}`;
}

/**
 * @description User prompt para identificación de producto por imagen (gpt-4o Vision — Sección 7.5).
 * @param {{ exporterCountry: string, importerCountry: string }} payload
 * @param {string} language
 */
function buildImageUserPrompt({ exporterCountry, importerCountry }, language) {
  return `Idioma de respuesta: ${language}

Analiza esta imagen con máxima precisión comercial y aduanera.

INSTRUCCIONES:
1. Identifica el producto: materiales principales, función comercial, uso previsto (industrial/doméstico), estado (nuevo/usado), acabado, texto en etiquetas, marcas visibles.
2. Determina el código HS internacional de 6 dígitos más preciso.
3. Si la imagen es ambigua, proporciona hasta 3 códigos HS alternativos ordenados por probabilidad.
4. Evalúa tu nivel de confianza de 0 a 100.
5. Identifica si el producto requiere certificaciones especiales: componentes electrónicos (CE/FCC), contacto con alimentos (sanitario), sustancias químicas (REACH/GHS), maquinaria (Directiva Máquinas).
6. Si la imagen es insuficiente para clasificar con confianza >70%, indica exactamente qué información adicional necesitas.

PAÍS EXPORTADOR: ${exporterCountry}
PAÍS IMPORTADOR: ${importerCountry}

Responde en este JSON exacto:
{
  "identified": true,
  "productDescription": "descripción detallada en lenguaje comercial y aduanero",
  "primaryHsCode": "000000",
  "primaryHsDescription": "descripción oficial de la subpartida HS",
  "alternativeCodes": [{ "hsCode": "000000", "description": "...", "probability": 85 }],
  "confidence": 94,
  "needsMoreInfo": false,
  "additionalInfoNeeded": null,
  "specialCertificationsLikely": ["CE", "RoHS"],
  "productAttributes": {
    "material": "...", "primaryFunction": "...",
    "intendedUse": "industrial|domestic|both|unknown",
    "condition": "new|used|unknown",
    "estimatedWeight": "...", "dangerousGoods": false, "requiresSpecialPermit": false
  }
}`;
}

/**
 * @description User prompt para OCR de documentos (gpt-4o Vision).
 * @param {{ exporterCountry: string, importerCountry: string }} payload
 * @param {string} language
 */
function buildOCRUserPrompt({ exporterCountry, importerCountry }, language) {
  return `Idioma de respuesta: ${language}

Extrae toda la información arancelariamente relevante de este documento comercial (factura, ficha técnica, lista de empaque o documento de transporte).

INSTRUCCIONES:
1. Identifica el producto o productos descritos.
2. Extrae: descripción técnica, materiales, país de origen, partida arancelaria si aparece, valor, peso, cantidad.
3. Determina el código HS internacional de 6 dígitos más preciso.
4. Si hay múltiples productos, clasifica el principal o el de mayor valor.

PAÍS EXPORTADOR: ${exporterCountry}
PAÍS IMPORTADOR: ${importerCountry}

Responde en el mismo JSON que la clasificación por imagen.`;
}

/**
 * @description User prompt para consolidación de fuentes oficiales (gpt-4o-mini — Sección 7.4).
 * @param {{ tariffResults: Array, exporterCountry: string, importerCountry: string, hsCode: string, productDescription: string }} payload
 * @param {string} language
 */
function buildConsolidateUserPrompt({ tariffResults, exporterCountry, importerCountry, hsCode, productDescription }, language) {
  return `Idioma de respuesta: ${language}

CÓDIGO HS INTERNACIONAL: ${hsCode}
PRODUCTO: ${productDescription}
PAÍS EXPORTADOR: ${exporterCountry}
PAÍS IMPORTADOR: ${importerCountry}

DATOS CRUDOS DE FUENTES OFICIALES:
${JSON.stringify(tariffResults, null, 2)}

INSTRUCCIONES DE EXTRACCIÓN — Extraer TODOS estos datos de cada fuente:

Para fuentes del PAÍS EXPORTADOR:
  □ Subpartida nacional y descripción
  □ Aranceles de exportación (si aplican)
  □ IVA/VAT de exportación y reembolso
  □ Documentos de exportación requeridos
  □ Certificaciones de exportación
  □ Requisitos fitosanitarios/sanitarios
  □ Controles de exportación

Para fuentes del PAÍS IMPORTADOR:
  □ Subpartida nacional y descripción
  □ Arancel NMF (Nación Más Favorecida)
  □ Aranceles preferenciales (SOLO si existe acuerdo verificado)
  □ IVA/GST de importación
  □ Derechos antidumping vigentes
  □ Derechos compensatorios
  □ Documentos de importación requeridos
  □ Certificaciones técnicas obligatorias
  □ Requisitos sanitarios/fitosanitarios
  □ Regulaciones ambientales
  □ Cuotas o contingentes

Para fuentes MULTILATERALES:
  □ Acuerdos comerciales VIGENTES entre ambos países (NUNCA inventar)
  □ Medidas no arancelarias registradas

REGLAS: Si una fuente no tiene datos relevantes → "Sin datos relevantes extraídos — [motivo]". NUNCA inventar. Indicar nivel de confiabilidad: "official" | "estimated" | "unverified".

Responde en JSON estructurado con campos:
{
  "exporterData": { "nationalSubheading": null, "exportDuties": {}, "exportDocuments": [], "exportRequirements": {} },
  "importerData": { "nationalSubheading": null, "importDuties": { "mfnRate": null, "importVAT": null, "antidumping": {} }, "importDocuments": [], "importRequirements": {} },
  "tradeAgreements": { "hasPreferentialAgreement": false, "agreementName": null, "preferentialRate": null },
  "sourcesWithData": 0,
  "dataQuality": "official|partial|estimated"
}`;
}

/**
 * @description User prompt para análisis espejo completo (gpt-4o — Sección 7.2).
 *              Produce { resultJson v2.2, mirrorAnalysis v2.2 } en una sola llamada.
 * @param {{ productDescription, primaryHsCode, confidence, exporterCountry, importerCountry, inputType, officialSourcesData, userLanguage }} payload
 * @param {string} language
 */
function buildMirrorUserPrompt({ productDescription, primaryHsCode, confidence, exporterCountry, importerCountry, inputType, officialSourcesData }, language) {
  return `Idioma de respuesta: ${language}

═══════════════════════════════════════════════════════
DATOS DE ENTRADA:
═══════════════════════════════════════════════════════
Producto: ${productDescription}
Código HS Internacional (6 dígitos): ${primaryHsCode}
Confianza de clasificación: ${confidence}%
País exportador: ${exporterCountry}
País importador: ${importerCountry}
Tipo de entrada: ${inputType}
Datos de fuentes oficiales consolidadas:
${JSON.stringify(officialSourcesData, null, 2)}

═══════════════════════════════════════════════════════
INSTRUCCIONES — SEGUIR EN ESTE ORDEN EXACTO:
═══════════════════════════════════════════════════════

PASO 1 — CLASIFICACIÓN HS INTERNACIONAL
Confirma el código HS de 6 dígitos. Proporciona descripción oficial y confianza.

PASO 2 — SUBPARTIDA NACIONAL DEL PAÍS EXPORTADOR
Determina la subpartida nacional completa (8-10 dígitos). Sistema de nomenclatura, descripción oficial, notas explicativas. Fuente: datos de fuentes oficiales proporcionadas.

PASO 3 — SUBPARTIDA NACIONAL DEL PAÍS IMPORTADOR
Mismo proceso para el país importador.

PASO 4 — TRIBUTOS DEL LADO EXPORTADOR
Todos los tributos/costos de exportación: arancel de exportación, IVA/VAT y reembolso, impuestos especiales.

PASO 5 — TRIBUTOS DEL LADO IMPORTADOR
Todos los tributos de importación: arancel NMF, preferencial (SOLO si acuerdo verificado), IVA/GST, antidumping, compensatorios, salvaguardias, especiales. Indicar fuente de cada dato.

PASO 6 — DOCUMENTOS REQUERIDOS (AMBOS PAÍSES POR SEPARADO)
Lista COMPLETA para exportar desde ${exporterCountry} Y para importar en ${importerCountry}.
Cada documento: nombre, required (boolean), descripción, issuedBy.
Incluir mínimo: factura comercial, packing list, B/L o AWB, declaración aduanera, seguro de transporte.

PASO 7 — ACUERDOS COMERCIALES — VALIDACIÓN RIGUROSA
⛔ NUNCA inventar acuerdos. Verificar en los datos de fuentes proporcionados.
Si NO puedes verificar → hasPreferentialAgreement: false.
TLC UE-China NO EXISTE a 2026. Verificar siempre antes de afirmar.

PASO 8 — REQUISITOS NO ARANCELARIOS (NTBs) — COMPARACIÓN ESPEJO
Para AMBOS países: certificaciones técnicas (CE, FDA, ANVISA...), sanitarios/fitosanitarios, REACH/RoHS, controles de exportación, cuotas, embargos.

PASO 9 — EVALUACIÓN DE RIESGO CONSOLIDADA
Nivel de riesgo (low|medium|high|critical), probabilidad de retención (0-100), factores de riesgo con mitigación, alertas críticas.

PASO 10 — SUBPARTIDA RECOMENDADA
La subpartida más apropiada para declarar en el país importador con justificación.

═══════════════════════════════════════════════════════
FORMATO DE RESPUESTA — JSON PURO SIN MARKDOWN:
═══════════════════════════════════════════════════════
{
  "resultJson": {
    "meta": { "generatedAt": "ISO timestamp", "language": "${language}", "inputType": "${inputType}", "modelUsed": "gpt-4o", "sourcesConsultedCount": 0, "sourcesWithDataCount": 0, "version": "2.2" },
    "product": { "description": "...", "hsCodeInternational": "${primaryHsCode}", "hsDescriptionInternational": "...", "confidence": ${confidence} },
    "exporter": {
      "countryCode": "${exporterCountry}", "countryName": "...",
      "nationalSubheading": "...", "nationalDescription": "...", "nomenclatureSystem": "...", "sourceUsed": "...", "sourceUrl": "...",
      "exportDuties": { "exportTariffRate": "...", "exportVAT": "...", "vatRefundRate": null, "exportTaxes": [], "source": "..." },
      "exportDocuments": [{ "document": "...", "required": true, "description": "...", "issuedBy": "..." }],
      "exportRequirements": { "exportLicense": { "required": false, "details": "...", "authority": "..." }, "qualityInspection": { "required": false, "details": "...", "authority": "..." }, "sanitaryPhytosanitary": { "required": false, "details": "...", "authority": "..." }, "technicalStandards": { "required": false, "details": "...", "authority": "..." }, "dualUseExportControl": { "required": false, "details": "...", "authority": "..." }, "labelingAndPackaging": { "required": false, "details": "...", "authority": "..." } }
    },
    "importer": {
      "countryCode": "${importerCountry}", "countryName": "...",
      "nationalSubheading": "...", "nationalDescription": "...", "nomenclatureSystem": "...", "sourceUsed": "...", "sourceUrl": "...",
      "importDuties": { "mfnTariffRate": "...", "preferentialTariffRate": null, "preferentialAgreement": null, "importVAT": "...", "additionalTaxes": [], "antidumpingDuty": { "applies": false, "rate": null, "regulation": null, "source": "..." }, "countervailingDuty": { "applies": false, "rate": null, "regulation": null, "source": "..." }, "safeguardMeasures": { "applies": false, "details": null }, "source": "..." },
      "importDocuments": [{ "document": "...", "required": true, "description": "...", "issuedBy": "..." }],
      "importRequirements": { "importLicense": { "required": false, "details": "...", "authority": "..." }, "sanitaryPhytosanitary": { "required": false, "details": "...", "authority": "..." }, "technicalStandards": { "required": false, "details": "...", "authority": "..." }, "environmentalRegulations": { "required": false, "details": "...", "authority": "..." }, "labelingAndPackaging": { "required": false, "details": "...", "authority": "..." }, "priorNotification": { "required": false, "details": "...", "authority": "..." }, "quotas": { "applies": false, "details": null }, "embargoes": { "applies": false, "details": null } }
    },
    "tradeAgreements": { "hasPreferentialAgreement": false, "agreementName": null, "agreementStatus": null, "preferentialRate": null, "rulesOfOrigin": null, "proofOfOriginRequired": null, "validationSource": "WTO RTA Database / Access2Markets", "validationNote": "..." },
    "costBreakdown": { "currency": "USD", "basedOnValue": "CIF", "note": "Valores referenciales. Confirmar con agente aduanal.", "items": [{ "concept": "...", "rate": "...", "calculation": "...", "estimatedAmount": null, "source": "..." }] },
    "sourcesConsulted": [{ "sourceName": "...", "sourceUrl": "...", "countryCode": "...", "dataExtracted": "...", "responseStatus": "ok" }]
  },
  "mirrorAnalysis": {
    "executiveSummary": "Resumen ejecutivo de 2-3 oraciones con los puntos más relevantes.",
    "subheadingComparison": { "exporterCode": "...", "importerCode": "...", "match": false, "discrepancyLevel": "none|low|medium|high|critical", "discrepancyExplanation": "...", "exporterNomenclatureNotes": "...", "importerNomenclatureNotes": "...", "semanticCoverageMatch": true, "reclassificationRisk": "..." },
    "taxComparison": {
      "exportSide": { "countryCode": "${exporterCountry}", "exportTariff": "...", "exportVAT": "...", "specialTaxes": "...", "totalExportCost": "...", "source": "..." },
      "importSide": { "countryCode": "${importerCountry}", "importTariff": "...", "importVAT": "...", "antidumping": "...", "countervailing": "...", "specialTaxes": "...", "totalImportCost": "...", "source": "..." },
      "totalEstimatedTaxBurden": "...", "divergences": []
    },
    "documentComparison": { "exporterDocuments": [], "importerDocuments": [], "commonDocuments": [], "exporterOnlyDocuments": [], "importerOnlyDocuments": [], "criticalMissing": [] },
    "ntbComparison": {
      "exporterNTBs": { "sanitaryPhytosanitary": { "applies": false, "details": "..." }, "technicalBarriers": { "applies": false, "details": "..." }, "environmentalRegulations": { "applies": false, "details": "...", "authority": "..." }, "exportControls": { "applies": false, "details": "..." }, "quotas": { "applies": false, "details": "..." }, "embargoes": { "applies": false, "details": "..." }, "antidumping": { "applies": false, "details": "..." } },
      "importerNTBs": { "sanitaryPhytosanitary": { "applies": false, "details": "..." }, "technicalBarriers": { "applies": false, "details": "...", "standards": [] }, "environmentalRegulations": { "applies": false, "details": "...", "authority": "..." }, "quotas": { "applies": false, "details": "..." }, "embargoes": { "applies": false, "details": "..." }, "antidumping": { "applies": false, "details": "..." } },
      "divergences": [{ "area": "...", "exporterRequirement": "...", "importerRequirement": "...", "riskLevel": "low|medium|high", "recommendation": "..." }]
    },
    "riskAssessment": { "overallLevel": "low|medium|high|critical", "probability": 0, "riskFactors": [{ "factor": "...", "severity": "low|medium|high", "mitigation": "..." }], "criticalAlerts": [{ "type": "sanitary|quota|license|prohibition|antidumping|dual_use|embargo|certification", "description": "...", "urgency": "pre_shipment|post_shipment" }] },
    "rulesOfOrigin": { "agreementApplies": false, "agreementName": null, "preferentialRate": null, "originCriteria": null, "proofOfOrigin": null, "cumulationAllowed": null, "minimisRule": null, "validationNote": "..." },
    "recommendedSubheading": { "code": "...", "forCountry": "${importerCountry}", "justification": "...", "alternativeCodes": [{ "code": "...", "reason": "...", "riskIfUsed": "..." }], "officialSource": "..." }
  }
}`;
}

/**
 * @description User prompt para clasificación básica Free plan (Sección 7.3).
 * @param {{ productDescription, primaryHsCode, confidence, exporterCountry, importerCountry, inputType, officialSourcesData }} payload
 * @param {string} language
 */
function buildClassifyBasicUserPrompt({ productDescription, primaryHsCode, confidence, exporterCountry, importerCountry, inputType, officialSourcesData }, language) {
  return `Idioma de respuesta: ${language}

Producto: ${productDescription}
Código HS Internacional: ${primaryHsCode}
País exportador: ${exporterCountry}
País importador: ${importerCountry}
Datos de fuentes consultadas: ${JSON.stringify(officialSourcesData)}

INSTRUCCIONES:
1. Determina subpartida nacional del país exportador.
2. Determina subpartida nacional del país importador.
3. Lista tributos PRINCIPALES de importación: arancel NMF, IVA/GST — con valores REALES no placeholders.
4. Lista documentos PRINCIPALES para exportar e importar (mínimo 3 cada uno).
5. Indica acuerdos comerciales SOLO si existen y están verificados.
6. Desglose básico de costos con tasas REALES.

⛔ NUNCA inventar acuerdos. ⛔ NUNCA dejar campos con "···" o vacíos.

Responde en JSON con la estructura completa de resultJson v2.2 (incluye meta.version="2.2"). mirrorAnalysis debe ser null.`;
}

/**
 * @description User prompt para reintentos con campos faltantes (Sección 7.6).
 * @param {{ missingFields: string[], previousPartialResponse: object, exporterCountry: string, importerCountry: string, officialSourcesData: object }} payload
 * @param {string} language
 */
function buildReinforceUserPrompt({ missingFields, previousPartialResponse, exporterCountry, importerCountry, officialSourcesData }, language) {
  return `Idioma de respuesta: ${language}

Tu respuesta anterior fue validada y se detectaron campos incompletos.
Los siguientes campos necesitan datos REALES:
${missingFields.map((f) => `- ${f}`).join('\n')}

RESPUESTA ANTERIOR (parcial):
${JSON.stringify(previousPartialResponse, null, 2)}

DATOS DE FUENTES DISPONIBLES:
${JSON.stringify(officialSourcesData)}

PAÍSES: Exportador=${exporterCountry}, Importador=${importerCountry}

Completa ÚNICAMENTE los campos faltantes. Devuelve solo los campos corregidos en JSON.`;
}

/**
 * @description Construye el contenido del mensaje de usuario según el tipo de tarea.
 * @param {string} taskType
 * @param {Object} payload
 * @param {string} language
 * @returns {string|Array}
 */
function buildUserContent(taskType, payload, language) {
  switch (taskType) {
    case 'text':           return buildTextUserPrompt(payload, language);
    case 'questions':      return buildQuestionsUserPrompt(payload, language);
    case 'consolidate':    return buildConsolidateUserPrompt(payload, language);
    case 'mirror':         return buildMirrorUserPrompt(payload, language);
    case 'classify_basic': return buildClassifyBasicUserPrompt(payload, language);
    case 'reinforce':      return buildReinforceUserPrompt(payload, language);
    case 'image':
      return [
        { type: 'text', text: buildImageUserPrompt(payload, language) },
        // detail: 'high' es obligatorio para precisión arancelaria
        { type: 'image_url', image_url: { url: payload.imageUrl, detail: 'high' } },
      ];
    case 'ocr':
      return [
        { type: 'text', text: buildOCRUserPrompt(payload, language) },
        { type: 'image_url', image_url: { url: payload.imageUrl, detail: 'high' } },
      ];
    default:
      throw new Error(`taskType desconocido: ${taskType}`);
  }
}

/**
 * @description Punto de entrada único para todas las interacciones con OpenAI.
 *              Enruta automáticamente entre gpt-4o y gpt-4o-mini según el tipo de tarea.
 *              Implementa retry con backoff exponencial (máx. 3 intentos) ante HTTP 429.
 * @param {'text'|'image'|'ocr'|'mirror'|'questions'|'consolidate'|'classify_basic'|'reinforce'} taskType
 * @param {Object} payload - Datos de entrada según el tipo de tarea
 * @param {string} language - Código ISO del idioma de respuesta (es/en/pt/fr...)
 * @returns {Promise<Object>} JSON parseado con la respuesta estructurada de OpenAI
 * @throws {Error} Si se agotan los 3 reintentos o el error no es recuperable
 */
async function callOpenAI(taskType, payload, language = 'es') {
  const model = MODEL_MAP[taskType];
  if (!model) throw new Error(`taskType inválido: ${taskType}`);

  const systemPrompt = SYSTEM_PROMPTS[taskType];
  const userContent  = buildUserContent(taskType, payload, language);
  const MAX_RETRIES  = 3;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userContent },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (err) {
      const isRateLimit = err?.status === 429 || err?.error?.type === 'rate_limit_exceeded';
      if (!isRateLimit || attempt === MAX_RETRIES) {
        console.error(`[openai.service] Error taskType=${taskType} intento=${attempt}:`, err?.message);
        throw err;
      }
      const waitSecs = Math.pow(2, attempt - 1);
      console.warn(`[openai.service] Rate limit. Reintentando en ${waitSecs}s... (${attempt}/${MAX_RETRIES})`);
      await sleep(attempt);
    }
  }
}

module.exports = { callOpenAI };
