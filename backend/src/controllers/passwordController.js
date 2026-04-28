const passwordService = require('../services/passwordService');

/**
 * @description Solicita el reset de contraseña. Siempre responde 200 para no revelar
 * si un email existe en el sistema (protección anti-enumeración).
 * @param {import('express').Request} req - Body: { email }
 * @param {import('express').Response} res
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'El campo email es requerido.' });
    }

    await passwordService.solicitarReset(email);

    return res.status(200).json({
      success: true,
      message: 'Si existe una cuenta con ese email, recibirás un enlace en los próximos minutos.',
    });
  } catch (error) {
    console.error('[forgotPassword]', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
};

/**
 * @description Valida el token de reset y actualiza la contraseña.
 * @param {import('express').Request} req - Body: { token, nuevaPassword }
 * @param {import('express').Response} res
 */
const resetPassword = async (req, res) => {
  try {
    const { token, nuevaPassword } = req.body;

    if (!token || !nuevaPassword) {
      return res.status(400).json({ success: false, message: 'Campos requeridos: token, nuevaPassword.' });
    }

    if (nuevaPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'La contraseña debe tener al menos 8 caracteres.' });
    }

    await passwordService.resetPassword({ token, nuevaPassword });

    return res.status(200).json({ success: true, message: 'Contraseña actualizada correctamente.' });
  } catch (error) {
    const errorMap = {
      RESET_TOKEN_INVALID: [400, 'El enlace de recuperación es inválido o ha expirado.'],
      USER_NOT_FOUND: [404, 'Usuario no encontrado.'],
    };

    const [status, message] = errorMap[error.message] || [500, 'Error interno del servidor.'];
    if (status === 500) console.error('[resetPassword]', error);
    return res.status(status).json({ success: false, message });
  }
};

module.exports = { forgotPassword, resetPassword };
