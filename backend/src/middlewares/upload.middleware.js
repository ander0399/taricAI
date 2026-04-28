const multer = require('multer');

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  // PDFs solo para el endpoint OCR (Fase 7)
  'application/pdf',
];

/**
 * @description Middleware multer para recibir imágenes en memoria antes de subirlas a Cloudinary.
 * Límite: 20 MB. Formatos: PNG, JPG, WEBP, HEIC, PDF (solo OCR).
 * El buffer queda en req.file.buffer listo para uploadImageToCloudinary().
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      const err = new Error('INVALID_FILE_TYPE');
      err.status = 400;
      cb(err);
    }
  },
});

/**
 * @description Middleware de error específico para fallos de multer (tipo inválido, tamaño excedido).
 * Debe registrarse DESPUÉS del middleware upload en la cadena de Express.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const handleUploadError = (err, _req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'FILE_TOO_LARGE', message: 'El archivo no puede superar 20 MB.' });
    }
    return res.status(400).json({ error: 'UPLOAD_ERROR', message: err.message });
  }
  if (err?.message === 'INVALID_FILE_TYPE') {
    return res.status(400).json({ error: 'INVALID_FILE_TYPE', message: 'Formato no permitido. Usa PNG, JPG, WEBP o HEIC.' });
  }
  next(err);
};

module.exports = { upload, handleUploadError };
