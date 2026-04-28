/**
 * @description Middleware global de manejo de errores. Captura errores no controlados
 * y retorna respuestas JSON consistentes. Debe registrarse al final del stack de Express.
 * @param {Error} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const errorHandler = (err, req, res, next) => {
  console.error('[GlobalError]', err.message, err.stack);

  const status = err.status || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Error interno del servidor.'
    : err.message;

  res.status(status).json({ success: false, message });
};

module.exports = errorHandler;
