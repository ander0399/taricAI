const { classifyText, classifyImage, classifyOCR, getClassificationHistory, getClassificationDetail } = require('../services/classifier.service');
const { generateClassificationPDF } = require('../services/pdf.export.service');
const { countries } = require('../utils/countries.data');
const { Subscription } = require('../models');

/**
 * @description Maneja POST /api/classifier/text
 *
 * Primera llamada (sin clarificationAnswers):
 *   → gpt-4o-mini genera preguntas dinámicas
 *   → Responde { data: { step: 'questions', questions: [...] } }
 *
 * Segunda llamada (con clarificationAnswers + países):
 *   → gpt-4o-mini clasifica el producto
 *   → Guarda en DB y responde { data: { step: 'completed', hsCode, ... } }
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const classifyTextHandler = async (req, res) => {
  try {
    const {
      description,
      clarificationAnswers = [],
      exporterCountry,
      importerCountry,
      language = 'es',
    } = req.body;

    const { userId, companyId } = req.user;
    const { tierInfo } = req;

    if (!description || description.trim().length < 5) {
      return res.status(400).json({
        error: 'INVALID_INPUT',
        message: 'La descripción del producto es requerida (mínimo 5 caracteres).',
      });
    }

    // Los países solo son obligatorios en la segunda llamada (con respuestas de clarificación)
    if (clarificationAnswers.length > 0) {
      if (!exporterCountry || exporterCountry.length !== 3) {
        return res.status(400).json({ error: 'INVALID_COUNTRY_CODE', field: 'exporterCountry' });
      }
      if (!importerCountry || importerCountry.length !== 3) {
        return res.status(400).json({ error: 'INVALID_COUNTRY_CODE', field: 'importerCountry' });
      }
    }

    const result = await classifyText({
      userId,
      companyId,
      tierInfo,
      description: description.trim(),
      clarificationAnswers,
      exporterCountry,
      importerCountry,
      language,
    });

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('[classifierController] classifyText:', error);

    if (error?.status === 503 || error?.code === 'ECONNREFUSED') {
      return res.status(503).json({ error: 'AI_SERVICE_UNAVAILABLE', retryAfter: 30 });
    }

    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Error al procesar la clasificación. Por favor intenta de nuevo.',
    });
  }
};

/**
 * @description Maneja POST /api/classifier/image
 *
 * Etapa 1 — multipart/form-data con campo 'image' (sin países):
 *   → Sube a Cloudinary + gpt-4o Vision identifica el producto
 *   → { data: { step: 'analyzed', imageUrl, productDescription, primaryHsCode, ... } }
 *   Frontend muestra la descripción en Paso 4 para confirmación.
 *
 * Etapa 2 — JSON con imageUrl + países (sin archivo):
 *   → gpt-4o Vision clasifica con contexto de países
 *   → Guarda en DB + { data: { step: 'completed', ... } }
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const classifyImageHandler = async (req, res) => {
  try {
    const { userId, companyId } = req.user;
    const { tierInfo } = req;
    const { imageUrl, exporterCountry, importerCountry, language = 'es' } = req.body;

    // Etapa 1: req.file presente → multer capturó el buffer
    const imageBuffer = req.file?.buffer ?? null;

    if (!imageBuffer && !imageUrl) {
      return res.status(400).json({
        error: 'INVALID_INPUT',
        message: 'Se requiere un archivo de imagen (Etapa 1) o imageUrl (Etapa 2).',
      });
    }

    // Etapa 2: validar países cuando se hace la clasificación completa
    if (!imageBuffer) {
      if (!exporterCountry || exporterCountry.length !== 3) {
        return res.status(400).json({ error: 'INVALID_COUNTRY_CODE', field: 'exporterCountry' });
      }
      if (!importerCountry || importerCountry.length !== 3) {
        return res.status(400).json({ error: 'INVALID_COUNTRY_CODE', field: 'importerCountry' });
      }
    }

    const result = await classifyImage({
      userId,
      companyId,
      tierInfo,
      imageBuffer,
      imageUrl,
      exporterCountry,
      importerCountry,
      language,
    });

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('[classifierController] classifyImage:', error);

    if (error?.status === 400) {
      return res.status(400).json({ error: 'INVALID_INPUT', message: error.message });
    }
    if (error?.status === 503 || error?.code === 'ECONNREFUSED') {
      return res.status(503).json({ error: 'AI_SERVICE_UNAVAILABLE', retryAfter: 30 });
    }
    return res.status(500).json({
      error: 'INTERNAL_ERROR',
      message: 'Error al procesar la imagen. Por favor intenta de nuevo.',
    });
  }
};

/**
 * @description Maneja POST /api/classifier/ocr (solo Pro, Team, Enterprise)
 *
 * Etapa 1 — multipart/form-data con campo 'image' (PDF o imagen, sin países):
 *   → ocr.service.js analiza el documento → { data: { step: 'analyzed', productDescription, ... } }
 *   Frontend muestra Paso 4 (confirmar descripción extraída del documento).
 *
 * Etapa 2 — JSON con description + países (confirmación de Paso 4 + Paso 5):
 *   → gpt-4o-mini con descripción confirmada → tariff + mirror → DB
 *   → { data: { step: 'completed', ... } }
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const classifyOCRHandler = async (req, res) => {
  try {
    const { userId, companyId } = req.user;
    const { tierInfo } = req;
    const { imageUrl, description, exporterCountry, importerCountry, language = 'es' } = req.body;

    const buffer = req.file?.buffer ?? null;
    const mimetype = req.file?.mimetype ?? null;

    if (!buffer && !description) {
      return res.status(400).json({
        error: 'INVALID_INPUT',
        message: 'Se requiere un archivo (Etapa 1) o description + países (Etapa 2).',
      });
    }

    if (!buffer) {
      if (!exporterCountry || exporterCountry.length !== 3) {
        return res.status(400).json({ error: 'INVALID_COUNTRY_CODE', field: 'exporterCountry' });
      }
      if (!importerCountry || importerCountry.length !== 3) {
        return res.status(400).json({ error: 'INVALID_COUNTRY_CODE', field: 'importerCountry' });
      }
    }

    const result = await classifyOCR({
      userId, companyId, tierInfo,
      buffer, mimetype, imageUrl, description,
      exporterCountry, importerCountry, language,
    });

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('[classifierController] classifyOCR:', error);
    if (error?.status === 400) {
      return res.status(400).json({ error: 'INVALID_INPUT', message: error.message });
    }
    if (error?.status === 503 || error?.code === 'ECONNREFUSED') {
      return res.status(503).json({ error: 'AI_SERVICE_UNAVAILABLE', retryAfter: 30 });
    }
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al procesar el documento. Por favor intenta de nuevo.' });
  }
};

/**
 * @description Maneja GET /api/classifier/history
 * Free/Pro: devuelve solo clasificaciones del usuario. Team/Enterprise: todas las de la empresa.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const getHistoryHandler = async (req, res) => {
  try {
    const { userId, companyId } = req.user;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));

    // Obtener plan para determinar si el historial es individual o de empresa
    const sub = await Subscription.findOne({ where: { companyId } });
    const plan = sub?.plan || 'free';

    const result = await getClassificationHistory({ companyId, userId, plan, page, limit });
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error('[classifierController] getHistory:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
};

/**
 * @description Maneja GET /api/classifier/history/:id
 * Retorna el detalle completo (con resultJson, mirrorAnalysis y fuentes) de una clasificación.
 * Solo devuelve clasificaciones de la empresa del usuario autenticado.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const getHistoryDetailHandler = async (req, res) => {
  try {
    const { userId, companyId } = req.user;
    const { id } = req.params;

    const record = await getClassificationDetail(id, userId, companyId);
    if (!record) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Clasificación no encontrada.' });
    }
    return res.status(200).json({ success: true, data: record });
  } catch (error) {
    console.error('[classifierController] getHistoryDetail:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
};

/**
 * @description Maneja GET /api/classifier/export/:id (solo Pro, Team, Enterprise)
 * Genera y descarga un PDF profesional con el resultado completo de la clasificación.
 * Solo devuelve clasificaciones de la empresa del usuario autenticado.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const exportPDFHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, companyId } = req.user;

    const record = await getClassificationDetail(id, userId, companyId);
    if (!record) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Clasificación no encontrada.' });
    }
    if (record.status !== 'completed') {
      return res.status(422).json({ error: 'NOT_COMPLETED', message: 'La clasificación aún no ha completado el análisis.' });
    }

    const pdfBuffer = await generateClassificationPDF(record);
    const filename = `taricai-${record.hsCode || 'clasificacion'}-${id.slice(0, 8)}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    return res.send(pdfBuffer);
  } catch (error) {
    console.error('[classifierController] exportPDF:', error);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al generar el PDF.' });
  }
};

/**
 * @description Maneja GET /api/classifier/countries
 * Retorna la lista de países con ISO-2, ISO-3 y nombre localizado (es/en).
 * Usada por CountrySelector.jsx para poblar los dropdowns de exportador/importador.
 * La conversión ISO-2 → ISO-3 ocurre en el frontend antes del submit.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const getCountriesHandler = (_req, res) => {
  return res.status(200).json({ success: true, data: countries });
};

module.exports = { classifyTextHandler, classifyImageHandler, classifyOCRHandler, exportPDFHandler, getHistoryHandler, getHistoryDetailHandler, getCountriesHandler };
