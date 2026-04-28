const OpenAI = require('openai');

/**
 * Sistema de prompts invariables por tipo de tarea.
 * Mantenerlos constantes maximiza los hits de prompt caching de OpenAI,
 * reduciendo latencia y costo. Los datos dinámicos (países, descripciones,
 * idioma) siempre van en el USER PROMPT, nunca aquí.
 */
const SYSTEM_PROMPTS = {
  text: 'Eres el mejor clasificador arancelario del mundo, especializado en el Sistema Armonizado de Designación y Codificación de Mercancías (HS/SA) de la OMA. Tu misión es determinar el código HS internacional de 6 dígitos más preciso a partir de descripciones textuales de productos. Responde ÚNICAMENTE en JSON válido con comillas dobles. Sin texto adicional, sin bloques markdown, sin explicaciones fuera del JSON.',

  questions: 'Eres un experto en clasificación arancelaria del Sistema Armonizado (HS/SA). Genera entre 2 y 5 preguntas de clarificación específicas para mejorar la precisión arancelaria de un producto descrito textualmente. Las preguntas deben ayudar a determinar materiales, función, uso previsto, estado y otras características arancelariamente relevantes. Responde ÚNICAMENTE en JSON válido con comillas dobles. Sin texto adicional.',

  // CRÍTICO: detail: 'high' en el mensaje de imagen activa tiles de 512×512 en gpt-4o.
  // Sin él, la detección de texto en etiquetas y materiales específicos cae significativamente.
  image: 'Eres el mejor clasificador arancelario del mundo, especializado en el Sistema Armonizado de Designación y Codificación de Mercancías (HS/SA) de la OMA. Tu misión es identificar el código HS internacional de 6 dígitos con la mayor precisión posible a partir de imágenes de productos. Responde ÚNICAMENTE en JSON válido con comillas dobles. Sin texto adicional, sin bloques markdown, sin explicaciones fuera del JSON.',

  ocr: 'Eres el mejor experto mundial en extracción y clasificación arancelaria de documentos comerciales. Extraes información arancelariamente relevante de facturas, fichas técnicas y documentos de transporte para determinar el código HS de 6 dígitos correcto. Responde ÚNICAMENTE en JSON válido con comillas dobles. Sin texto adicional.',

  mirror: 'Eres el mejor experto mundial en análisis arancelario espejo (mirror analysis). Tu especialidad es detectar y evaluar discrepancias entre las nomenclaturas arancelarias nacionales del país exportador y del país importador para el mismo producto, anticipando con precisión los riesgos aduaneros reales. Responde ÚNICAMENTE en JSON válido con comillas dobles. Sin texto adicional.',

  consolidate: 'Eres un experto en estructuración de datos arancelarios. Consolidas información de múltiples fuentes oficiales en un JSON tipado y coherente. Prioriza datos del país importador para aranceles de importación. Responde ÚNICAMENTE en JSON válido con comillas dobles. Sin texto adicional.',
};

/**
 * Enrutamiento dual de modelos:
 * - gpt-4o      → imagen, OCR, espejo (visión multimodal + razonamiento complejo)
 * - gpt-4o-mini → texto, preguntas, consolidación (17× más económico, suficiente para NLP arancelario)
 */
const MODEL_MAP = {
  image: 'gpt-4o',
  ocr: 'gpt-4o',
  mirror: 'gpt-4o',
  text: 'gpt-4o-mini',
  questions: 'gpt-4o-mini',
  consolidate: 'gpt-4o-mini',
};

// Un solo cliente — una sola OPENAI_API_KEY para todo el módulo
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * @description Espera con backoff exponencial antes de reintentar tras rate limit.
 * @param {number} attempt - Número de intento actual (1-based)
 */
const sleep = (attempt) =>
  new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt - 1) * 1000));

// ─── BUILDERS DE USER PROMPTS (dinámicos) ────────────────────────────────────

/**
 * @description User prompt para clasificación por descripción textual (gpt-4o-mini).
 * @param {{ description: string, clarificationAnswers: Array, exporterCountry: string, importerCountry: string }} payload
 * @param {string} language - Código ISO del idioma de respuesta
 */
function buildTextUserPrompt({ description, clarificationAnswers = [], exporterCountry, importerCountry }, language) {
  const answersBlock = clarificationAnswers.length
    ? `\nRESPUESTAS DE CLARIFICACIÓN:\n${clarificationAnswers.map((a) => `- ${a.questionId}: ${a.answer}`).join('\n')}`
    : '';

  return `Idioma de respuesta: ${language}

DESCRIPCIÓN DEL PRODUCTO:
"${description}"
${answersBlock}

PAÍS EXPORTADOR: ${exporterCountry}
PAÍS IMPORTADOR: ${importerCountry}

INSTRUCCIONES:
1. Determina el código HS internacional de 6 dígitos más preciso para este producto.
2. Si la descripción es ambigua, proporciona hasta 3 códigos HS alternativos ordenados de mayor a menor probabilidad.
3. Evalúa tu nivel de confianza de 0 a 100.
4. Si la información es insuficiente para clasificar con confianza >70, indica qué información adicional necesitas.

Responde en este JSON exacto:
{
  "productDescription": "descripción detallada en lenguaje comercial y aduanero",
  "primaryHsCode": "000000",
  "primaryHsDescription": "descripción oficial de la subpartida HS",
  "alternativeCodes": [
    { "hsCode": "000000", "description": "...", "probability": 85 }
  ],
  "confidence": 94,
  "needsMoreInfo": false,
  "additionalInfoNeeded": null,
  "productAttributes": {
    "material": "...",
    "primaryFunction": "...",
    "intendedUse": "industrial|domestic|both|unknown",
    "condition": "new|used|unknown",
    "dangerousGoods": false,
    "requiresSpecialPermit": false
  }
}`;
}

/**
 * @description User prompt para generación de preguntas dinámicas de clarificación (gpt-4o-mini).
 * @param {{ description: string }} payload
 * @param {string} language
 */
function buildQuestionsUserPrompt({ description }, language) {
  return `Idioma de respuesta: ${language}

DESCRIPCIÓN DEL PRODUCTO: "${description}"

Genera 2 a 5 preguntas de clarificación específicas para este producto.
Cada pregunta debe tener opciones de respuesta tipo chip (máx. 5 opciones) cuando sea posible.
El objetivo es alcanzar ≥90% de confianza en la clasificación HS.

Responde en este JSON exacto:
{
  "questions": [
    {
      "id": "q1",
      "text": "Texto de la pregunta",
      "type": "chips",
      "options": ["Opción A", "Opción B", "Opción C"]
    }
  ]
}`;
}

/**
 * @description User prompt para clasificación por imagen (gpt-4o Vision) — Fase 3.
 * @param {{ exporterCountry: string, importerCountry: string }} payload
 * @param {string} language
 */
function buildImageUserPrompt({ exporterCountry, importerCountry }, language) {
  return `Idioma de respuesta: ${language}

Analiza esta imagen con máxima precisión comercial y aduanera.

INSTRUCCIONES:
1. Identifica el producto: materiales principales, función comercial, uso previsto (industrial/doméstico), estado (nuevo/usado), acabado, dimensiones aproximadas si son visibles, texto en etiquetas.
2. Determina el código HS internacional de 6 dígitos más preciso.
3. Si la imagen es ambigua, proporciona hasta 3 códigos HS alternativos ordenados de mayor a menor probabilidad.
4. Evalúa tu nivel de confianza de 0 a 100.
5. Si la imagen es insuficiente para clasificar con confianza >70, indica exactamente qué información adicional necesitas.

PAÍS EXPORTADOR: ${exporterCountry}
PAÍS IMPORTADOR: ${importerCountry}

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
    "material": "...", "primaryFunction": "...", "intendedUse": "industrial|domestic|both|unknown",
    "condition": "new|used|unknown", "estimatedWeight": "...", "dangerousGoods": false, "requiresSpecialPermit": false
  }
}`;
}

/**
 * @description User prompt para OCR de documentos (gpt-4o Vision) — Fase 7.
 * @param {{ exporterCountry: string, importerCountry: string }} payload
 * @param {string} language
 */
function buildOCRUserPrompt({ exporterCountry, importerCountry }, language) {
  return `Idioma de respuesta: ${language}

Extrae toda la información arancelariamente relevante de este documento comercial (factura, ficha técnica, lista de empaque o documento de transporte).

INSTRUCCIONES:
1. Identifica el producto o productos descritos.
2. Extrae: descripción técnica, materiales, país de origen, partida arancelaria si aparece, valor, peso, cantidad.
3. Determina el código HS internacional de 6 dígitos más preciso basado en la información extraída.
4. Si hay múltiples productos, clasifica el principal o el de mayor valor.

PAÍS EXPORTADOR: ${exporterCountry}
PAÍS IMPORTADOR: ${importerCountry}

Responde en el mismo JSON que la clasificación por imagen.`;
}

/**
 * @description User prompt para análisis espejo exportador–importador (gpt-4o) — Fase 5.
 * @param {{ hsCode, productDescription, exporterCountry, importerCountry, hsCodeOrigin, hsCodeDest, tariffData }} payload
 * @param {string} language
 */
function buildMirrorUserPrompt({ hsCode, productDescription, exporterCountry, importerCountry, hsCodeOrigin, hsCodeDest, tariffData }, language) {
  return `Idioma de respuesta: ${language}

CÓDIGO HS INTERNACIONAL (6 dígitos): ${hsCode}
DESCRIPCIÓN OFICIAL DEL PRODUCTO: ${productDescription}
PAÍS EXPORTADOR: ${exporterCountry} — subpartida nacional declarada: ${hsCodeOrigin}
PAÍS IMPORTADOR: ${importerCountry} — subpartida nacional asignada: ${hsCodeDest}
DATOS DE FUENTES OFICIALES CONSULTADAS: ${JSON.stringify(tariffData)}

ANÁLISIS REQUERIDO:
1. CONCORDANCIA: ¿Las subpartidas del exportador e importador clasifican el mismo producto bajo la misma categoría? Detecta y describe cada divergencia.
2. RIESGO ADUANERO: Evalúa el riesgo real de retención, revisión técnica o multa. Incluye probabilidad en %.
3. REGLAS DE ORIGEN: ¿Existe acuerdo comercial entre los dos países? ¿El producto cumple los criterios de origen?
4. SUBPARTIDA RECOMENDADA: ¿Qué subpartida recomiendas declarar y por qué?
5. ALERTAS CRÍTICAS PREVIAS AL EMBARQUE: Restricciones, prohibiciones, cuotas, licencias, controles sanitarios.

Responde en este JSON exacto:
{
  "concordance": { "match": true, "discrepancyLevel": "none|low|medium|high|critical" },
  "exporterSubheading": { "code": "...", "officialDescription": "...", "source": "..." },
  "importerSubheading": { "code": "...", "officialDescription": "...", "source": "..." },
  "divergences": ["descripción de cada divergencia encontrada"],
  "riskAssessment": { "level": "low|medium|high|critical", "probability": 75, "explanation": "..." },
  "rulesOfOrigin": { "agreementApplies": true, "agreementName": "...", "compliant": true, "transformationRequired": "...", "preferentialRate": "0%" },
  "recommendedSubheading": { "code": "...", "rationale": "justificación con referencia a fuente oficial" },
  "criticalAlerts": [{ "type": "sanitary|quota|license|prohibition|antidumping|dual_use", "description": "...", "urgency": "pre_shipment|post_shipment" }]
}`;
}

/**
 * @description User prompt para consolidar datos de fuentes oficiales (gpt-4o-mini) — Fase 4.
 * @param {{ tariffResults, exporterCountry, importerCountry, hsCode, productDescription }} payload
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

Consolida y estructura los datos arancelarios. Prioriza datos del país importador para aranceles de importación. Incluye solo información verificable de las fuentes provistas.

Responde en este JSON exacto:
{
  "hsCodeOrigin": "subpartida del exportador o null",
  "hsCodeDest": "subpartida del importador o null",
  "mfnRate": "arancel MFN del importador o null",
  "preferentialRate": "arancel preferencial si aplica acuerdo comercial o null",
  "tradeAgreement": "nombre del acuerdo comercial o null",
  "vat": "IVA/GST del importador o null",
  "specialTaxes": [],
  "requiredDocumentsExport": [],
  "requiredDocumentsImport": [],
  "specialRegulations": [],
  "estimatedCosts": { "customsDuty": "...", "vat": "...", "portFees": "..." }
}`;
}

/**
 * @description Construye el contenido del mensaje de usuario según el tipo de tarea.
 * Para imagen y OCR devuelve un array multimodal (texto + imagen_url).
 * Para el resto devuelve un string.
 * @param {string} taskType
 * @param {Object} payload
 * @param {string} language
 * @returns {string|Array}
 */
function buildUserContent(taskType, payload, language) {
  switch (taskType) {
    case 'text':        return buildTextUserPrompt(payload, language);
    case 'questions':   return buildQuestionsUserPrompt(payload, language);
    case 'mirror':      return buildMirrorUserPrompt(payload, language);
    case 'consolidate': return buildConsolidateUserPrompt(payload, language);
    case 'image':
      return [
        { type: 'text', text: buildImageUserPrompt(payload, language) },
        // detail: 'high' es obligatorio para precisión arancelaria (detecta texto en etiquetas, materiales)
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
 *              Enruta automáticamente entre gpt-4o (imagen/OCR/espejo) y
 *              gpt-4o-mini (texto/preguntas/consolidación) según el tipo de tarea.
 *              Implementa retry con backoff exponencial (máx. 3 intentos) ante
 *              errores HTTP 429 (rate limit) de OpenAI.
 * @param {'text'|'image'|'ocr'|'mirror'|'questions'|'consolidate'} taskType
 * @param {Object} payload - Datos de entrada según el tipo de tarea
 * @param {string} language - Código ISO del idioma de respuesta (es/en/pt/fr...)
 * @returns {Promise<Object>} JSON parseado con la respuesta estructurada de OpenAI
 * @throws {Error} Si se agotan los 3 reintentos o el error no es recuperable
 */
async function callOpenAI(taskType, payload, language = 'es') {
  const model = MODEL_MAP[taskType];
  if (!model) throw new Error(`taskType inválido: ${taskType}`);

  const systemPrompt = SYSTEM_PROMPTS[taskType];
  const userContent = buildUserContent(taskType, payload, language);

  const MAX_RETRIES = 3;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        response_format: { type: 'json_object' },
        // Temperatura baja para máxima consistencia arancelaria — clasificar no es creativo
        temperature: 0.1,
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (err) {
      // Reintentar solo en rate limit (429). Cualquier otro error falla inmediatamente.
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
