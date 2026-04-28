const { enviarContactoEnterprise } = require('../services/enterpriseService');

/**
 * @description Recibe el formulario de contacto Enterprise, valida campos requeridos,
 *              guarda el lead en DB y envía email interno al equipo de ventas.
 *              Endpoint público — no requiere autenticación JWT.
 * @param {import('express').Request} req - Body: { name, email, company, country, usersCount, volume?, message? }
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {Promise<void>}
 */
const contactEnterprise = async (req, res, next) => {
  try {
    const { name, email, company, country, usersCount, volume, message } = req.body;

    if (!name || !email || !company || !country || !usersCount) {
      return res.status(400).json({
        ok: false,
        message: 'Los campos nombre, email, empresa, país y número de usuarios son obligatorios.',
      });
    }

    if (Number(usersCount) < 15) {
      return res.status(400).json({
        ok: false,
        message: 'El Plan Enterprise requiere un mínimo de 15 usuarios.',
      });
    }

    await enviarContactoEnterprise({ name, email, company, country, usersCount, volume, message });

    res.status(200).json({ ok: true, message: 'Solicitud recibida. Nuestro equipo te contactará en menos de 24 horas.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { contactEnterprise };
