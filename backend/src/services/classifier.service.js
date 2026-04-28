const { v4: uuidv4 } = require('uuid');
const { Classifications } = require('../models');
const { callOpenAI } = require('./openai.service');
const { uploadImageToCloudinary } = require('./image.upload.service');
const { queryOfficialSources } = require('./tariff.service');
const { performMirrorAnalysis } = require('./mirror.service');
const { analyzeDocument } = require('./ocr.service');

/**
 * @description Genera preguntas de clarificación dinámicas para un producto descrito por texto.
 *              Usa gpt-4o-mini. El frontend las muestra como chips seleccionables.
 *              Se llama cuando clarificationAnswers está vacío en el flujo de texto.
 * @param {string} description - Descripción inicial del producto
 * @param {string} language - Código ISO del idioma (es/en/pt/fr)
 * @returns {Promise<{ step: 'questions', questions: Array }>}
 */
async function generateClarificationQuestions(description, language) {
  const result = await callOpenAI('questions', { description }, language);
  return {
    step: 'questions',
    questions: result.questions || [],
  };
}

/**
 * @description Orquesta el flujo completo de clasificación por descripción textual.
 *
 * Flujo en dos etapas:
 *   1ª llamada (sin clarificationAnswers) → genera preguntas de clarificación con gpt-4o-mini
 *   2ª llamada (con clarificationAnswers) → clasifica con gpt-4o-mini → guarda en DB → retorna resultado
 *
 * Integraciones pendientes:
 *   [FASE 4] tariff.service.js — consulta paralela de fuentes arancelarias oficiales
 *   [FASE 4] openai.service.js 'consolidate' — consolida datos de fuentes en JSON tipado
 *   [FASE 5] mirror.service.js — análisis espejo exportador–importador (solo Pro+)
 *
 * @param {{ userId: string, companyId: string, tierInfo: object, description: string, clarificationAnswers: Array, exporterCountry: string, importerCountry: string, language: string }} params
 * @returns {Promise<object>} { step: 'questions', questions } | resultado de clasificación completo
 */
async function classifyText({ userId, companyId, tierInfo, description, clarificationAnswers = [], exporterCountry, importerCountry, language = 'es' }) {
  // Primera etapa del flujo de texto: generar preguntas si no hay respuestas aún
  if (clarificationAnswers.length === 0) {
    return generateClarificationQuestions(description, language);
  }

  // Crear registro con status 'pending' para rastrear fallos y no dejar huérfanos
  const classificationId = uuidv4();
  await Classifications.create({
    id: classificationId,
    userId,
    companyId,
    inputType: 'text',
    inputData: description,
    originCountry: exporterCountry,
    destCountry: importerCountry,
    status: 'pending',
  });

  try {
    // Clasificar con gpt-4o-mini: determinar código HS primario y atributos del producto
    const aiResult = await callOpenAI(
      'text',
      { description, clarificationAnswers, exporterCountry, importerCountry },
      language,
    );

    // Consultar fuentes arancelarias oficiales en paralelo (exportador + importador + multilaterales)
    const { tariffResults, sourceCount } = await queryOfficialSources(
      classificationId,
      exporterCountry,
      importerCountry,
    );

    // Consolidar datos de fuentes con gpt-4o-mini en JSON tipado
    let tariffData = null;
    if (tariffResults.length > 0) {
      tariffData = await callOpenAI('consolidate', {
        tariffResults,
        exporterCountry,
        importerCountry,
        hsCode: aiResult.primaryHsCode,
        productDescription: aiResult.productDescription,
      }, language);
    }

    // Análisis espejo: solo disponible para planes Pro, Team y Enterprise (mirror: true en tiers.js)
    let mirrorAnalysis = null;
    if (tierInfo.limites.mirror && aiResult.primaryHsCode) {
      mirrorAnalysis = await performMirrorAnalysis(
        aiResult.primaryHsCode,
        aiResult.productDescription,
        exporterCountry,
        importerCountry,
        tariffData?.hsCodeOrigin || null,
        tariffData?.hsCodeDest || null,
        tariffData,
        language,
      );
    }

    const resultJson = {
      productDescription: aiResult.productDescription,
      primaryHsCode: aiResult.primaryHsCode,
      primaryHsDescription: aiResult.primaryHsDescription,
      alternativeCodes: aiResult.alternativeCodes || [],
      productAttributes: aiResult.productAttributes || {},
      needsMoreInfo: aiResult.needsMoreInfo || false,
      additionalInfoNeeded: aiResult.additionalInfoNeeded || null,
      tariffData,
      mirrorAnalysis,
      sourcesConsulted: sourceCount,
    };

    await Classifications.update(
      {
        hsCode: aiResult.primaryHsCode,
        hsCodeOrigin: tariffData?.hsCodeOrigin || mirrorAnalysis?.exporterSubheading?.code || null,
        hsCodeDest: tariffData?.hsCodeDest || mirrorAnalysis?.importerSubheading?.code || null,
        resultJson,
        confidence: tierInfo.limites.scoring ? (aiResult.confidence ?? null) : null,
        mirrorAnalysis,
        status: 'completed',
      },
      { where: { id: classificationId } },
    );

    return {
      step: 'completed',
      classificationId,
      hsCode: aiResult.primaryHsCode,
      hsDescription: aiResult.primaryHsDescription,
      hsCodeOrigin: tariffData?.hsCodeOrigin || mirrorAnalysis?.exporterSubheading?.code || null,
      hsCodeDest: tariffData?.hsCodeDest || mirrorAnalysis?.importerSubheading?.code || null,
      confidence: tierInfo.limites.scoring ? (aiResult.confidence ?? null) : null,
      productDescription: aiResult.productDescription,
      alternativeCodes: aiResult.alternativeCodes || [],
      productAttributes: aiResult.productAttributes || {},
      needsMoreInfo: aiResult.needsMoreInfo || false,
      additionalInfoNeeded: aiResult.additionalInfoNeeded || null,
      tariffData,
      mirrorAnalysis,
      sourcesConsulted: sourceCount,
    };
  } catch (error) {
    // Siempre marcar como error — no dejar registros 'pending' huérfanos
    await Classifications.update({ status: 'error' }, { where: { id: classificationId } });
    throw error;
  }
}

/**
 * @description Orquesta el flujo de clasificación por imagen con dos etapas.
 *
 * Etapa 1 — Análisis de imagen (imageBuffer presente, sin países):
 *   Upload a Cloudinary → gpt-4o Vision identifica el producto
 *   → { step: 'analyzed', imageUrl, productDescription, primaryHsCode, ... }
 *   Frontend muestra Paso 4 (confirmar descripción) con este resultado.
 *
 * Etapa 2 — Clasificación completa (imageUrl + países en body JSON):
 *   gpt-4o Vision con descripción confirmada + países
 *   → guarda en DB → { step: 'completed', ... }
 *   [FASE 4] tariff sources + [FASE 5] mirror se añadirán aquí.
 *
 * @param {{ userId: string, companyId: string, tierInfo: object, imageBuffer?: Buffer, imageUrl?: string, exporterCountry?: string, importerCountry?: string, language: string }} params
 * @returns {Promise<object>}
 */
async function classifyImage({ userId, companyId, tierInfo, imageBuffer, imageUrl, exporterCountry, importerCountry, language = 'es' }) {
  // ── Etapa 1: analizar imagen para obtener descripción del producto ──────────
  if (imageBuffer) {
    const { url } = await uploadImageToCloudinary(imageBuffer);

    // gpt-4o Vision identifica el producto sin países — la HS es internacional
    const aiResult = await callOpenAI('image', {
      imageUrl: url,
      exporterCountry: exporterCountry || '---',
      importerCountry: importerCountry || '---',
    }, language);

    return {
      step: 'analyzed',
      imageUrl: url,
      productDescription: aiResult.productDescription,
      primaryHsCode: aiResult.primaryHsCode,
      primaryHsDescription: aiResult.primaryHsDescription,
      alternativeCodes: aiResult.alternativeCodes || [],
      confidence: aiResult.confidence,
      productAttributes: aiResult.productAttributes || {},
      needsMoreInfo: aiResult.needsMoreInfo || false,
      additionalInfoNeeded: aiResult.additionalInfoNeeded || null,
    };
  }

  // ── Etapa 2: clasificación completa con países y URL de Cloudinary ──────────
  if (!imageUrl || !exporterCountry || !importerCountry) {
    throw Object.assign(new Error('imageUrl, exporterCountry e importerCountry son requeridos en Etapa 2'), { status: 400 });
  }

  const classificationId = uuidv4();
  await Classifications.create({
    id: classificationId,
    userId,
    companyId,
    inputType: 'image',
    inputData: imageUrl,
    originCountry: exporterCountry,
    destCountry: importerCountry,
    status: 'pending',
  });

  try {
    const aiResult = await callOpenAI('image', { imageUrl, exporterCountry, importerCountry }, language);

    // Consultar fuentes arancelarias oficiales en paralelo
    const { tariffResults, sourceCount } = await queryOfficialSources(
      classificationId,
      exporterCountry,
      importerCountry,
    );

    let tariffData = null;
    if (tariffResults.length > 0) {
      tariffData = await callOpenAI('consolidate', {
        tariffResults,
        exporterCountry,
        importerCountry,
        hsCode: aiResult.primaryHsCode,
        productDescription: aiResult.productDescription,
      }, language);
    }

    // Análisis espejo: solo Pro, Team y Enterprise
    let mirrorAnalysis = null;
    if (tierInfo.limites.mirror && aiResult.primaryHsCode) {
      mirrorAnalysis = await performMirrorAnalysis(
        aiResult.primaryHsCode,
        aiResult.productDescription,
        exporterCountry,
        importerCountry,
        tariffData?.hsCodeOrigin || null,
        tariffData?.hsCodeDest || null,
        tariffData,
        language,
      );
    }

    const resultJson = {
      productDescription: aiResult.productDescription,
      primaryHsCode: aiResult.primaryHsCode,
      primaryHsDescription: aiResult.primaryHsDescription,
      alternativeCodes: aiResult.alternativeCodes || [],
      productAttributes: aiResult.productAttributes || {},
      needsMoreInfo: aiResult.needsMoreInfo || false,
      tariffData,
      mirrorAnalysis,
      sourcesConsulted: sourceCount,
    };

    await Classifications.update(
      {
        hsCode: aiResult.primaryHsCode,
        hsCodeOrigin: tariffData?.hsCodeOrigin || mirrorAnalysis?.exporterSubheading?.code || null,
        hsCodeDest: tariffData?.hsCodeDest || mirrorAnalysis?.importerSubheading?.code || null,
        resultJson,
        confidence: tierInfo.limites.scoring ? (aiResult.confidence ?? null) : null,
        mirrorAnalysis,
        status: 'completed',
      },
      { where: { id: classificationId } },
    );

    return {
      step: 'completed',
      classificationId,
      hsCode: aiResult.primaryHsCode,
      hsDescription: aiResult.primaryHsDescription,
      hsCodeOrigin: tariffData?.hsCodeOrigin || mirrorAnalysis?.exporterSubheading?.code || null,
      hsCodeDest: tariffData?.hsCodeDest || mirrorAnalysis?.importerSubheading?.code || null,
      confidence: tierInfo.limites.scoring ? (aiResult.confidence ?? null) : null,
      productDescription: aiResult.productDescription,
      alternativeCodes: aiResult.alternativeCodes || [],
      productAttributes: aiResult.productAttributes || {},
      needsMoreInfo: aiResult.needsMoreInfo || false,
      imageUrl,
      tariffData,
      mirrorAnalysis,
      sourcesConsulted: sourceCount,
    };
  } catch (error) {
    await Classifications.update({ status: 'error' }, { where: { id: classificationId } });
    throw error;
  }
}

/**
 * @description Orquesta el flujo de clasificación por documento OCR con dos etapas.
 *
 * Etapa 1 — Análisis de documento (buffer presente, sin países):
 *   ocr.service.js detecta si es PDF de texto o escaneado/imagen:
 *     PDF texto   → pdf-parse + gpt-4o-mini (más económico)
 *     PDF/imagen escaneado → Cloudinary + gpt-4o Vision
 *   → { step: 'analyzed', imageUrl?, productDescription, primaryHsCode, ... }
 *   Frontend muestra Paso 4 (confirmar descripción extraída).
 *
 * Etapa 2 — Clasificación completa (description + países en JSON):
 *   Usa gpt-4o-mini con descripción confirmada + países → HS code → tariff + mirror → DB
 *   → { step: 'completed', ... }
 *
 * @param {{ userId, companyId, tierInfo, buffer?, mimetype?, imageUrl?, description?, exporterCountry?, importerCountry?, language }} params
 * @returns {Promise<object>}
 */
async function classifyOCR({ userId, companyId, tierInfo, buffer, mimetype, imageUrl, description, exporterCountry, importerCountry, language = 'es' }) {
  // ── Etapa 1: analizar documento para extraer descripción del producto ─────────
  if (buffer) {
    const { aiResult, imageUrl: uploadedUrl } = await analyzeDocument(
      buffer,
      mimetype,
      exporterCountry || '---',
      importerCountry || '---',
      language,
    );

    return {
      step: 'analyzed',
      imageUrl: uploadedUrl,
      productDescription: aiResult.productDescription,
      primaryHsCode: aiResult.primaryHsCode,
      primaryHsDescription: aiResult.primaryHsDescription,
      alternativeCodes: aiResult.alternativeCodes || [],
      confidence: aiResult.confidence,
      productAttributes: aiResult.productAttributes || {},
      needsMoreInfo: aiResult.needsMoreInfo || false,
      additionalInfoNeeded: aiResult.additionalInfoNeeded || null,
    };
  }

  // ── Etapa 2: clasificación completa con descripción confirmada y países ───────
  if (!description || !exporterCountry || !importerCountry) {
    throw Object.assign(
      new Error('description, exporterCountry e importerCountry son requeridos en Etapa 2'),
      { status: 400 },
    );
  }

  const classificationId = uuidv4();
  await Classifications.create({
    id: classificationId,
    userId,
    companyId,
    inputType: 'ocr',
    inputData: imageUrl || description,
    originCountry: exporterCountry,
    destCountry: importerCountry,
    status: 'pending',
  });

  try {
    // Usar gpt-4o-mini con descripción confirmada por el usuario en Paso 4
    const aiResult = await callOpenAI('text', {
      description,
      clarificationAnswers: [],
      exporterCountry,
      importerCountry,
    }, language);

    const { tariffResults, sourceCount } = await queryOfficialSources(
      classificationId,
      exporterCountry,
      importerCountry,
    );

    let tariffData = null;
    if (tariffResults.length > 0) {
      tariffData = await callOpenAI('consolidate', {
        tariffResults,
        exporterCountry,
        importerCountry,
        hsCode: aiResult.primaryHsCode,
        productDescription: aiResult.productDescription,
      }, language);
    }

    let mirrorAnalysis = null;
    if (tierInfo.limites.mirror && aiResult.primaryHsCode) {
      mirrorAnalysis = await performMirrorAnalysis(
        aiResult.primaryHsCode,
        aiResult.productDescription,
        exporterCountry,
        importerCountry,
        tariffData?.hsCodeOrigin || null,
        tariffData?.hsCodeDest || null,
        tariffData,
        language,
      );
    }

    const resultJson = {
      productDescription: aiResult.productDescription,
      primaryHsCode: aiResult.primaryHsCode,
      primaryHsDescription: aiResult.primaryHsDescription,
      alternativeCodes: aiResult.alternativeCodes || [],
      productAttributes: aiResult.productAttributes || {},
      needsMoreInfo: aiResult.needsMoreInfo || false,
      tariffData,
      mirrorAnalysis,
      sourcesConsulted: sourceCount,
    };

    await Classifications.update(
      {
        hsCode: aiResult.primaryHsCode,
        hsCodeOrigin: tariffData?.hsCodeOrigin || mirrorAnalysis?.exporterSubheading?.code || null,
        hsCodeDest: tariffData?.hsCodeDest || mirrorAnalysis?.importerSubheading?.code || null,
        resultJson,
        confidence: tierInfo.limites.scoring ? (aiResult.confidence ?? null) : null,
        mirrorAnalysis,
        status: 'completed',
      },
      { where: { id: classificationId } },
    );

    return {
      step: 'completed',
      classificationId,
      hsCode: aiResult.primaryHsCode,
      hsDescription: aiResult.primaryHsDescription,
      hsCodeOrigin: tariffData?.hsCodeOrigin || mirrorAnalysis?.exporterSubheading?.code || null,
      hsCodeDest: tariffData?.hsCodeDest || mirrorAnalysis?.importerSubheading?.code || null,
      confidence: tierInfo.limites.scoring ? (aiResult.confidence ?? null) : null,
      productDescription: aiResult.productDescription,
      alternativeCodes: aiResult.alternativeCodes || [],
      productAttributes: aiResult.productAttributes || {},
      needsMoreInfo: aiResult.needsMoreInfo || false,
      imageUrl: imageUrl || null,
      tariffData,
      mirrorAnalysis,
      sourcesConsulted: sourceCount,
    };
  } catch (error) {
    await Classifications.update({ status: 'error' }, { where: { id: classificationId } });
    throw error;
  }
}

/**
 * @description Retorna el historial paginado de clasificaciones. Implementado en Fase 6.
 * @param {{ companyId: string, userId: string, plan: string, page: number, limit: number }} params
 * @returns {Promise<object>}
 */
async function getClassificationHistory({ companyId, userId, plan, page = 1, limit = 20 }) {
  const { Op } = require('sequelize');
  const TIER_LIMITS = require('../config/tiers');
  const tierLimits = TIER_LIMITS[plan];

  const where = tierLimits.sharedClassifications
    ? { companyId }
    : { userId };

  const offset = (page - 1) * limit;

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
 * @description Retorna el detalle completo de una clasificación por ID. Implementado en Fase 6.
 * @param {string} classificationId
 * @param {string} userId
 * @param {string} companyId
 * @returns {Promise<object>}
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
