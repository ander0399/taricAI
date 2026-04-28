const cloudinary = require('../config/cloudinary');

/**
 * @description Sube un buffer de imagen a Cloudinary y retorna la URL segura optimizada.
 *              La URL resultante se pasa directamente a gpt-4o Vision con detail: 'high'.
 *              Cloudinary aplica quality: auto y fetch_format: auto para reducir tamaño
 *              sin comprometer la precisión de detección de materiales y texto en etiquetas.
 * @param {Buffer} buffer - Buffer del archivo (de multer.memoryStorage — req.file.buffer)
 * @param {string} [folder='taricai/classifications'] - Carpeta destino en Cloudinary
 * @returns {Promise<{ url: string, publicId: string }>}
 * @throws {Error} Si Cloudinary rechaza la subida (credenciales, red, formato no soportado)
 */
async function uploadImageToCloudinary(buffer, folder = 'taricai/classifications') {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        quality: 'auto',
        fetch_format: 'auto',
        tags: ['taricai', 'classification'],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({ url: result.secure_url, publicId: result.public_id });
      },
    );
    stream.end(buffer);
  });
}

module.exports = { uploadImageToCloudinary };
