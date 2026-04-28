const cloudinary = require('cloudinary').v2;

/**
 * @description Cliente Cloudinary inicializado con variables de entorno.
 * Usado por image.upload.service.js para subir imágenes antes de enviarlas a gpt-4o Vision.
 * Las URLs generadas son optimizadas automáticamente (quality: auto, format: auto).
 */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = cloudinary;
