const pdfParse = require('pdf-parse');

/**
 * @description Extrae texto legible de un buffer PDF.
 *              Retorna null si el PDF es escaneado (sin texto) o si la extracción falla,
 *              lo que indica a ocr.service.js que debe usar gpt-4o Vision en su lugar.
 *              Limita el texto a 5 000 caracteres para no saturar el contexto de OpenAI.
 * @param {Buffer} buffer - Buffer del archivo PDF (de multer.memoryStorage)
 * @returns {Promise<string|null>} Texto extraído o null si el PDF es escaneado/ilegible
 */
async function extractTextFromPDF(buffer) {
  try {
    const data = await pdfParse(buffer, { max: 3 }); // Máx. 3 páginas para facturas/fichas
    const text = data.text?.replace(/\s+/g, ' ').trim();

    // PDF sin texto significativo (escaneado o imagen embebida) — mínimo 50 chars
    if (!text || text.length < 50) return null;

    return text.slice(0, 5000);
  } catch {
    // pdf-parse lanza si el archivo está corrupto o es ilegible
    return null;
  }
}

module.exports = { extractTextFromPDF };
