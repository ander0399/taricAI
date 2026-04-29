const bcrypt = require('bcrypt');

/**
 * @description Hashea una contraseña en texto claro usando bcrypt.
 * Usa BCRYPT_ROUNDS desde .env o 10 como fallback seguro.
 * Las contraseñas en texto claro SOLO existen en data/users.data.js — nunca en DB.
 *
 * @param {string} plainPassword - Contraseña en texto claro
 * @returns {Promise<string>} Hash bcrypt listo para guardar en DB
 * @throws {Error} Si plainPassword está vacío o no es string
 */
async function hashPassword(plainPassword) {
  if (!plainPassword || typeof plainPassword !== 'string') {
    throw new Error('hashPassword: plainPassword debe ser un string no vacío');
  }
  const rounds = parseInt(process.env.BCRYPT_ROUNDS, 10) || 10;
  return bcrypt.hash(plainPassword, rounds);
}

module.exports = { hashPassword };
