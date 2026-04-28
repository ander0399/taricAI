const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { enviarResetPassword } = require('./emailService');

const SALT_ROUNDS = 12;
const RESET_EXPIRY = '15m';

/**
 * @description Genera un JWT de recuperación de contraseña de vida corta (15 min).
 * No expone si el email existe para evitar enumeración de usuarios (siempre responde igual).
 * @param {string} email
 * @returns {Promise<void>}
 */
const solicitarReset = async (email) => {
  const user = await User.findOne({ where: { email, activo: true } });

  // Salida silenciosa si no existe — no revelar información de cuentas
  if (!user) return;

  const resetToken = jwt.sign(
    { userId: user.id, companyId: user.companyId, purpose: 'password_reset' },
    process.env.JWT_SECRET,
    { expiresIn: RESET_EXPIRY }
  );

  await enviarResetPassword({ destinatario: email, nombre: user.nombre, token: resetToken });
};

/**
 * @description Valida el token de reset y actualiza la contraseña del usuario.
 * El token solo es válido si fue emitido con purpose='password_reset' y no ha expirado.
 * @param {{ token: string, nuevaPassword: string }} datos
 * @returns {Promise<void>}
 */
const resetPassword = async ({ token, nuevaPassword }) => {
  let payload;

  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new Error('RESET_TOKEN_INVALID');
  }

  if (payload.purpose !== 'password_reset') throw new Error('RESET_TOKEN_INVALID');

  const user = await User.findOne({ where: { id: payload.userId, activo: true } });
  if (!user) throw new Error('USER_NOT_FOUND');

  const passwordHash = await bcrypt.hash(nuevaPassword, SALT_ROUNDS);
  await user.update({ password: passwordHash });
};

module.exports = { solicitarReset, resetPassword };
