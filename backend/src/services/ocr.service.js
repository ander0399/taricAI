const { uploadImageToCloudinary } = require('./image.upload.service');
const { extractTextFromPDF } = require('./pdf.parser.service');
const { callOpenAI } = require('./openai.service');

/**
 * @description Analiza un documento (PDF o imagen) para extraer información arancelaria.
 *
 * Enrutamiento por tipo de archivo y contenido:
 *   PDF con texto extraíble → pdf-parse + gpt-4o-mini (17× más económico, suficiente para texto)
 *   PDF escaneado (sin texto) → Cloudinary + gpt-4o Vision con task 'ocr'
 *   Imagen (JPG/PNG/WEBP/HEIC) → Cloudinary + gpt-4o Vision con task 'ocr'
 *
 * Retorna la descripción del producto y el código HS preliminar para Paso 4 (confirmar descripción).
 *
 * @param {Buffer} buffer - Buffer del archivo (de multer.memoryStorage)
 * @param {string} mimetype - MIME type del archivo
 * @param {string} [exporterCountry='---'] - ISO alpha-3 del país exportador
 * @param {string} [importerCountry='---'] - ISO alpha-3 del país importador
 * @param {string} [language='es'] - Código ISO del idioma de respuesta
 * @returns {Promise<{ aiResult: object, imageUrl: string|null }>}
 * @throws {Error} Si el PDF escaneado no puede subirse a Cloudinary o si gpt-4o falla
 */
async function analyzeDocument(buffer, mimetype, exporterCountry = '---', importerCountry = '---', language = 'es') {
  let aiResult;
  let imageUrl = null;

  if (mimetype === 'application/pdf') {
    const extractedText = await extractTextFromPDF(buffer);

    if (extractedText) {
      // PDF con texto: usar gpt-4o-mini (más económico, precisión suficiente para texto estructurado)
      aiResult = await callOpenAI('text', {
        description: `[Documento comercial] ${extractedText}`,
        clarificationAnswers: [],
        exporterCountry,
        importerCountry,
      }, language);
    } else {
      // PDF escaneado: necesita visión — subir a Cloudinary como imagen
      // Nota: Cloudinary acepta PDFs y los convierte automáticamente en imagen procesable por gpt-4o
      const uploaded = await uploadImageToCloudinary(buffer, 'taricai/ocr-documents');
      imageUrl = uploaded.url;
      aiResult = await callOpenAI('ocr', { imageUrl, exporterCountry, importerCountry }, language);
    }
  } else {
    // Imagen (JPG/PNG/WEBP/HEIC): gpt-4o Vision con task 'ocr'
    const uploaded = await uploadImageToCloudinary(buffer, 'taricai/ocr-documents');
    imageUrl = uploaded.url;
    aiResult = await callOpenAI('ocr', { imageUrl, exporterCountry, importerCountry }, language);
  }

  return { aiResult, imageUrl };
}

module.exports = { analyzeDocument };
