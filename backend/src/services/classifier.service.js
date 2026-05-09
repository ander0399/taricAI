const { v4: uuidv4 } = require('uuid');
const { Classifications } = require('../models');
const { callOpenAI }              = require('./openai.service');
const { uploadImageToCloudinary } = require('./image.upload.service');
const { queryOfficialSources }    = require('./tariff.service');
const { performMirrorAnalysis }   = require('./mirror.service');
const { analyzeDocument }         = require('./ocr.service');
const { validateTradeAgreements, syncRulesOfOrigin } = require('./agreement.validator');
const { validateAIResponse }      = require('./response.validator');

const AI_RETRY_ON_INCOMPLETE = process.env.AI_RETRY_ON_INCOMPLETE !== 'false';

/**
 * @description Genera preguntas de clarificación dinámicas (gpt-4o-mini).
 * @param {string} description
 * @param {string} language
 * @returns {Promise<{ step: 'questions', questions: Array }>}
 */
async function generateClarificationQuestions(description, language) {
  const result = await callOpenAI('questions', { description }, language);
  return { step: 'questions', questions: result.questions || [] };
}

/**
 * @description Consolida datos de fuentes y ejecuta clasificación IA para Pro/Team/Enterprise.
 *              Retorna { resultJson v2.2, mirrorAnalysis v2.2 } desde performMirrorAnalysis.
 *              Para Free plan, retorna { resultJson v2.2, mirrorAnalysis: null }.
 *
 * @param {{ aiResult, tariffResults, allSourcesFailed, exporterCountry, importerCountry, tierInfo, inputType, language }} params
 * @returns {Promise<{ resultJson: Object, mirrorAnalysis: Object|null }>}
 */
async function buildClassification({ aiResult, tariffResults, allSourcesFailed, exporterCountry, importerCountry, tierInfo, inputType, language }) {
  // Consolidar datos crudos de fuentes en estructura tipada
  let consolidatedSources = null;
  if (tariffResults.length > 0) {
    consolidatedSources = await callOpenAI('consolidate', {
      tariffResults,
      exporterCountry,
      importerCountry,
      hsCode: aiResult.primaryHsCode,
      productDescription: aiResult.productDescription,
    }, language);
  }

  // Para Pro/Team/Enterprise: espejo completo produce { resultJson v2.2, mirrorAnalysis v2.2 }
  if (tierInfo.limites.mirror && aiResult.primaryHsCode) {
    const { resultJson, mirrorAnalysis } = await performMirrorAnalysis(
      aiResult.primaryHsCode,
      aiResult.productDescription,
      exporterCountry,
      importerCountry,
      aiResult.confidence || 0,
      inputType,
      consolidatedSources,
      language,
    );

    return await applyPostValidation({ resultJson, mirrorAnalysis, exporterCountry, importerCountry, consolidatedSources, allSourcesFailed, language });
  }

  // Para Free plan: clasificación básica (sin análisis espejo)
  const basicResult = await callOpenAI('classify_basic', {
    productDescription:   aiResult.productDescription,
    primaryHsCode:        aiResult.primaryHsCode,
    confidence:           aiResult.confidence || 0,
    exporterCountry,
    importerCountry,
    inputType,
    officialSourcesData:  consolidatedSources || {},
  }, language);

  // La respuesta de classify_basic puede venir directo como resultJson o envuelta
  const resultJson = basicResult.resultJson || basicResult;
  if (!resultJson.meta) {
    resultJson.meta = { version: '2.2', generatedAt: new Date().toISOString(), language, inputType, modelUsed: 'gpt-4o-mini' };
  }

  return await applyPostValidation({ resultJson, mirrorAnalysis: null, exporterCountry, importerCountry, consolidatedSources, allSourcesFailed, language });
}

/**
 * @description Aplica validación post-IA: verifica completitud, corrige acuerdos,
 *              propaga consistencia interna, y reintenta si hay campos faltantes.
 * @param {{ resultJson, mirrorAnalysis, exporterCountry, importerCountry, consolidatedSources, allSourcesFailed, language }} params
 * @returns {Promise<{ resultJson: Object, mirrorAnalysis: Object|null }>}
 */
async function applyPostValidation({ resultJson, mirrorAnalysis, exporterCountry, importerCountry, consolidatedSources, allSourcesFailed, language }) {
  if (!resultJson) return { resultJson: null, mirrorAnalysis: null };

  // Asegurar meta.version = '2.2'
  if (!resultJson.meta) resultJson.meta = {};
  resultJson.meta.version = '2.2';
  resultJson.meta.generatedAt = resultJson.meta.generatedAt || new Date().toISOString();

  // Validar completitud
  const validation = validateAIResponse({ resultJson, mirrorAnalysis }, exporterCountry, importerCountry);

  // Reintentar con prompt reforzado si hay campos faltantes y el retry está habilitado
  if (!validation.valid && AI_RETRY_ON_INCOMPLETE && validation.missingFields.length > 0) {
    try {
      const reinforced = await callOpenAI('reinforce', {
        missingFields:           validation.missingFields,
        previousPartialResponse: { resultJson, mirrorAnalysis },
        exporterCountry,
        importerCountry,
        officialSourcesData:     consolidatedSources || {},
      }, language);

      // Mezclar campos reforzados en el resultJson original
      if (reinforced.resultJson || reinforced.exporter || reinforced.importer) {
        const patch = reinforced.resultJson || reinforced;
        if (patch.exporter) resultJson.exporter = { ...resultJson.exporter, ...patch.exporter };
        if (patch.importer) resultJson.importer = { ...resultJson.importer, ...patch.importer };
        if (patch.tradeAgreements) resultJson.tradeAgreements = { ...resultJson.tradeAgreements, ...patch.tradeAgreements };
        if (patch.costBreakdown)   resultJson.costBreakdown   = { ...resultJson.costBreakdown,   ...patch.costBreakdown   };
      }
    } catch (reinforceErr) {
      console.warn('[classifier] Reintento con prompt reforzado falló:', reinforceErr.message);
    }
  }

  // Validar y corregir acuerdos comerciales
  if (resultJson.tradeAgreements) {
    resultJson.tradeAgreements = validateTradeAgreements(
      resultJson.tradeAgreements,
      exporterCountry,
      importerCountry,
    );

    // Propagar consistencia a rulesOfOrigin en mirrorAnalysis
    if (mirrorAnalysis?.rulesOfOrigin) {
      mirrorAnalysis.rulesOfOrigin = syncRulesOfOrigin(
        resultJson.tradeAgreements,
        mirrorAnalysis.rulesOfOrigin,
      );
    }
  }

  // Advertencia cuando todas las fuentes fallaron
  if (allSourcesFailed) {
    resultJson.meta.warning = '⚠️ Todas las fuentes consultadas fallaron. Datos basados en conocimiento del modelo de IA. Verificar con agente aduanal.';
  }

  return { resultJson, mirrorAnalysis: mirrorAnalysis || null };
}

/**
 * @description Extrae campos clave del resultJson v2.2 para la respuesta al frontend y la DB.
 * @param {Object} resultJson - v2.2
 * @param {Object} aiResult   - Resultado inicial de identificación HS
 * @param {boolean} scoringEnabled
 * @returns {Object}
 */
function extractResponseFields(resultJson, aiResult, scoringEnabled) {
  const hsCode      = resultJson?.product?.hsCodeInternational || aiResult?.primaryHsCode || null;
  const hsCodeOrigin = resultJson?.exporter?.nationalSubheading || null;
  const hsCodeDest  = resultJson?.importer?.nationalSubheading  || null;
  const confidence  = scoringEnabled ? (resultJson?.product?.confidence ?? aiResult?.confidence ?? null) : null;

  return { hsCode, hsCodeOrigin, hsCodeDest, confidence };
}

// ─── FLUJO DE TEXTO ──────────────────────────────────────────────────────────

/**
 * @description Orquesta el flujo completo de clasificación por descripción textual.
 *
 * Flujo en dos etapas:
 *   1ª llamada (sin clarificationAnswers) → genera preguntas de clarificación
 *   2ª llamada (con clarificationAnswers) → HS + fuentes + espejo/básico + validación + DB
 *
 * @param {{ userId, companyId, tierInfo, description, clarificationAnswers, exporterCountry, importerCountry, language }} params
 * @returns {Promise<object>}
 */
async function classifyText({ userId, companyId, tierInfo, description, clarificationAnswers = [], exporterCountry, importerCountry, language = 'es' }) {
  if (clarificationAnswers.length === 0) {
    return generateClarificationQuestions(description, language);
  }

  const classificationId = uuidv4();
  await Classifications.create({
    id: classificationId, userId, companyId,
    inputType: 'text', inputData: description,
    originCountry: exporterCountry, destCountry: importerCountry,
    status: 'pending',
  });

  try {
    // Paso 1: identificar HS
    const aiResult = await callOpenAI('text', { description, clarificationAnswers, exporterCountry, importerCountry }, language);

    // Paso 2: consultar fuentes
    const { tariffResults, sourceCount, allSourcesFailed } = await queryOfficialSources(classificationId, exporterCountry, importerCountry);

    // Paso 3: clasificar (espejo Pro+ o básico Free)
    const { resultJson, mirrorAnalysis } = await buildClassification({
      aiResult, tariffResults, allSourcesFailed, exporterCountry, importerCountry,
      tierInfo, inputType: 'text', language,
    });

    if (resultJson?.meta) {
      resultJson.meta.sourcesConsultedCount = sourceCount;
    }

    const { hsCode, hsCodeOrigin, hsCodeDest, confidence } = extractResponseFields(resultJson, aiResult, tierInfo.limites.scoring);

    await Classifications.update(
      { hsCode, hsCodeOrigin, hsCodeDest, resultJson, confidence, mirrorAnalysis, status: 'completed' },
      { where: { id: classificationId } },
    );

    return {
      step: 'completed', classificationId,
      hsCode, hsDescription: resultJson?.product?.hsDescriptionInternational || aiResult.primaryHsDescription,
      hsCodeOrigin, hsCodeDest, confidence,
      productDescription: resultJson?.product?.description || aiResult.productDescription,
      alternativeCodes: aiResult.alternativeCodes || [],
      productAttributes: aiResult.productAttributes || {},
      needsMoreInfo: aiResult.needsMoreInfo || false,
      additionalInfoNeeded: aiResult.additionalInfoNeeded || null,
      resultJson, mirrorAnalysis,
      sourcesConsulted: sourceCount,
    };
  } catch (error) {
    await Classifications.update({ status: 'error' }, { where: { id: classificationId } });
    throw error;
  }
}

// ─── FLUJO DE IMAGEN ─────────────────────────────────────────────────────────

/**
 * @description Orquesta el flujo de clasificación por imagen con dos etapas.
 *
 * Etapa 1 (imageBuffer presente): Upload Cloudinary → gpt-4o Vision identifica producto.
 * Etapa 2 (imageUrl + países):    Fuentes + espejo/básico + validación + DB.
 *
 * @param {{ userId, companyId, tierInfo, imageBuffer?, imageUrl?, exporterCountry?, importerCountry?, language }} params
 * @returns {Promise<object>}
 */
async function classifyImage({ userId, companyId, tierInfo, imageBuffer, imageUrl, exporterCountry, importerCountry, language = 'es' }) {
  if (imageBuffer) {
    const { url } = await uploadImageToCloudinary(imageBuffer);
    const aiResult = await callOpenAI('image', {
      imageUrl: url,
      exporterCountry: exporterCountry || '---',
      importerCountry: importerCountry || '---',
    }, language);

    return {
      step: 'analyzed', imageUrl: url,
      productDescription:  aiResult.productDescription,
      primaryHsCode:       aiResult.primaryHsCode,
      primaryHsDescription: aiResult.primaryHsDescription,
      alternativeCodes:    aiResult.alternativeCodes || [],
      confidence:          aiResult.confidence,
      productAttributes:   aiResult.productAttributes || {},
      needsMoreInfo:       aiResult.needsMoreInfo || false,
      additionalInfoNeeded: aiResult.additionalInfoNeeded || null,
    };
  }

  if (!imageUrl || !exporterCountry || !importerCountry) {
    throw Object.assign(new Error('imageUrl, exporterCountry e importerCountry son requeridos en Etapa 2'), { status: 400 });
  }

  const classificationId = uuidv4();
  await Classifications.create({
    id: classificationId, userId, companyId,
    inputType: 'image', inputData: imageUrl,
    originCountry: exporterCountry, destCountry: importerCountry,
    status: 'pending',
  });

  try {
    const aiResult = await callOpenAI('image', { imageUrl, exporterCountry, importerCountry }, language);
    const { tariffResults, sourceCount, allSourcesFailed } = await queryOfficialSources(classificationId, exporterCountry, importerCountry);

    const { resultJson, mirrorAnalysis } = await buildClassification({
      aiResult, tariffResults, allSourcesFailed, exporterCountry, importerCountry,
      tierInfo, inputType: 'image', language,
    });

    if (resultJson?.meta) resultJson.meta.sourcesConsultedCount = sourceCount;

    const { hsCode, hsCodeOrigin, hsCodeDest, confidence } = extractResponseFields(resultJson, aiResult, tierInfo.limites.scoring);

    await Classifications.update(
      { hsCode, hsCodeOrigin, hsCodeDest, resultJson, confidence, mirrorAnalysis, status: 'completed' },
      { where: { id: classificationId } },
    );

    return {
      step: 'completed', classificationId,
      hsCode, hsDescription: resultJson?.product?.hsDescriptionInternational || aiResult.primaryHsDescription,
      hsCodeOrigin, hsCodeDest, confidence,
      productDescription:   resultJson?.product?.description || aiResult.productDescription,
      alternativeCodes:     aiResult.alternativeCodes || [],
      productAttributes:    aiResult.productAttributes || {},
      needsMoreInfo:        aiResult.needsMoreInfo || false,
      imageUrl, resultJson, mirrorAnalysis,
      sourcesConsulted: sourceCount,
    };
  } catch (error) {
    await Classifications.update({ status: 'error' }, { where: { id: classificationId } });
    throw error;
  }
}

// ─── FLUJO DE OCR ────────────────────────────────────────────────────────────

/**
 * @description Orquesta el flujo de clasificación por documento OCR con dos etapas.
 *
 * Etapa 1 (buffer): ocr.service detecta tipo → extrae descripción.
 * Etapa 2 (description + países): Fuentes + espejo/básico + validación + DB.
 *
 * @param {{ userId, companyId, tierInfo, buffer?, mimetype?, imageUrl?, description?, exporterCountry?, importerCountry?, language }} params
 * @returns {Promise<object>}
 */
async function classifyOCR({ userId, companyId, tierInfo, buffer, mimetype, imageUrl, description, exporterCountry, importerCountry, language = 'es' }) {
  if (buffer) {
    const { aiResult, imageUrl: uploadedUrl } = await analyzeDocument(
      buffer, mimetype,
      exporterCountry || '---',
      importerCountry || '---',
      language,
    );
    return {
      step: 'analyzed', imageUrl: uploadedUrl,
      productDescription:  aiResult.productDescription,
      primaryHsCode:       aiResult.primaryHsCode,
      primaryHsDescription: aiResult.primaryHsDescription,
      alternativeCodes:    aiResult.alternativeCodes || [],
      confidence:          aiResult.confidence,
      productAttributes:   aiResult.productAttributes || {},
      needsMoreInfo:       aiResult.needsMoreInfo || false,
      additionalInfoNeeded: aiResult.additionalInfoNeeded || null,
    };
  }

  if (!description || !exporterCountry || !importerCountry) {
    throw Object.assign(
      new Error('description, exporterCountry e importerCountry son requeridos en Etapa 2'),
      { status: 400 },
    );
  }

  const classificationId = uuidv4();
  await Classifications.create({
    id: classificationId, userId, companyId,
    inputType: 'ocr', inputData: imageUrl || description,
    originCountry: exporterCountry, destCountry: importerCountry,
    status: 'pending',
  });

  try {
    const aiResult = await callOpenAI('text', { description, clarificationAnswers: [], exporterCountry, importerCountry }, language);
    const { tariffResults, sourceCount, allSourcesFailed } = await queryOfficialSources(classificationId, exporterCountry, importerCountry);

    const { resultJson, mirrorAnalysis } = await buildClassification({
      aiResult, tariffResults, allSourcesFailed, exporterCountry, importerCountry,
      tierInfo, inputType: 'ocr', language,
    });

    if (resultJson?.meta) resultJson.meta.sourcesConsultedCount = sourceCount;

    const { hsCode, hsCodeOrigin, hsCodeDest, confidence } = extractResponseFields(resultJson, aiResult, tierInfo.limites.scoring);

    await Classifications.update(
      { hsCode, hsCodeOrigin, hsCodeDest, resultJson, confidence, mirrorAnalysis, status: 'completed' },
      { where: { id: classificationId } },
    );

    return {
      step: 'completed', classificationId,
      hsCode, hsDescription: resultJson?.product?.hsDescriptionInternational || aiResult.primaryHsDescription,
      hsCodeOrigin, hsCodeDest, confidence,
      productDescription:   resultJson?.product?.description || aiResult.productDescription,
      alternativeCodes:     aiResult.alternativeCodes || [],
      productAttributes:    aiResult.productAttributes || {},
      needsMoreInfo:        aiResult.needsMoreInfo || false,
      imageUrl: imageUrl || null, resultJson, mirrorAnalysis,
      sourcesConsulted: sourceCount,
    };
  } catch (error) {
    await Classifications.update({ status: 'error' }, { where: { id: classificationId } });
    throw error;
  }
}

// ─── LECTURA ─────────────────────────────────────────────────────────────────

/**
 * @description Retorna el historial paginado de clasificaciones.
 * @param {{ companyId, userId, plan, page, limit }} params
 */
async function getClassificationHistory({ companyId, userId, plan, page = 1, limit = 20 }) {
  const TIER_LIMITS = require('../config/tiers');
  const tierLimits  = TIER_LIMITS[plan];
  const where       = tierLimits.sharedClassifications ? { companyId } : { userId };
  const offset      = (page - 1) * limit;

  const { rows, count } = await Classifications.findAndCountAll({
    where,
    attributes: { exclude: ['resultJson', 'mirrorAnalysis'] },
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });

  return {
    rows: rows.map((c) => c.toJSON()),
    count,
    totalPages: Math.ceil(count / limit),
    page,
  };
}

/**
 * @description Retorna el detalle completo de una clasificación por ID.
 * @param {string} classificationId
 * @param {string} userId
 * @param {string} companyId
 */
async function getClassificationDetail(classificationId, userId, companyId) {
  const { ClassificationSources } = require('../models');
  const record = await Classifications.findOne({
    where: { id: classificationId, companyId },
    include: [{ model: ClassificationSources, as: 'fuentes' }],
  });
  if (!record) return null;
  return record.toJSON();
}

module.exports = {
  classifyText,
  classifyImage,
  classifyOCR,
  generateClarificationQuestions,
  getClassificationHistory,
  getClassificationDetail,
};
