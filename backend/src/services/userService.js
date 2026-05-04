const { User, Company, sequelize } = require('../models');
const { syncStripeSeats } = require('./seat.service');

/**
 * @description Retorna todos los usuarios activos de la empresa del solicitante.
 * El filtro por companyId garantiza el aislamiento multi-tenant.
 * @param {string} companyId
 * @returns {Promise<object[]>}
 */
const listarUsuarios = async (companyId) => {
  const usuarios = await User.findAll({
    where: { companyId, activo: true },
    attributes: { exclude: ['password'] },
    order: [['createdAt', 'ASC']],
  });
  return usuarios.map((u) => u.toJSON());
};

/**
 * @description Cambia el rol de un usuario dentro de la empresa.
 * Reglas: solo el owner puede cambiar roles; no se puede cambiar el rol del owner.
 * @param {{ targetUserId: string, nuevoRol: string, requesterId: string, companyId: string }} datos
 * @returns {Promise<object>}
 */
const cambiarRol = async ({ targetUserId, nuevoRol, requesterId, companyId }) => {
  const target = await User.findOne({ where: { id: targetUserId, companyId, activo: true } });
  if (!target) throw new Error('USER_NOT_FOUND');
  if (target.role === 'owner') throw new Error('CANNOT_MODIFY_OWNER');
  if (target.id === requesterId) throw new Error('CANNOT_MODIFY_SELF');
  if (!['admin', 'member'].includes(nuevoRol)) throw new Error('INVALID_ROLE');

  await target.update({ role: nuevoRol });

  const { password, ...safe } = target.toJSON();
  return safe;
};

/**
 * @description Desactiva (soft-delete) un usuario de la empresa.
 * No se puede desactivar al owner ni al propio solicitante.
 * @param {{ targetUserId: string, requesterId: string, companyId: string }} datos
 * @returns {Promise<void>}
 */
const desactivarUsuario = async ({ targetUserId, requesterId, companyId }) => {
  const target = await User.findOne({ where: { id: targetUserId, companyId, activo: true } });
  if (!target) throw new Error('USER_NOT_FOUND');
  if (target.role === 'owner') throw new Error('CANNOT_DEACTIVATE_OWNER');
  if (target.id === requesterId) throw new Error('CANNOT_DEACTIVATE_SELF');

  await target.update({ activo: false });

  // Trigger de seats: reducir quantity en Stripe si la empresa es Plan Team
  // El usuario ya tiene activo=false en DB — el conteo de syncStripeSeats lo excluirá
  try {
    await syncStripeSeats(companyId);
  } catch (seatError) {
    // Stripe genera crédito prorrateado en el siguiente ciclo — loggear sin bloquear
    console.error('[Seats] Error al sincronizar seats tras desactivar usuario:', seatError.message);
  }
};

/**
 * @description Transfiere la propiedad de la empresa a otro usuario activo de la misma empresa.
 * El owner anterior pasa a rol 'admin'. Operación atómica — ambos updates en una transacción.
 * @param {{ nuevoOwnerId: string, currentOwnerId: string, companyId: string }} datos
 * @returns {Promise<object>} Nuevo owner (sin password)
 */
const transferirPropiedad = async ({ nuevoOwnerId, currentOwnerId, companyId }) => {
  if (nuevoOwnerId === currentOwnerId) throw new Error('SAME_USER');

  const nuevoOwner = await User.findOne({ where: { id: nuevoOwnerId, companyId, activo: true } });
  if (!nuevoOwner) throw new Error('USER_NOT_FOUND');
  if (nuevoOwner.role === 'owner') throw new Error('ALREADY_OWNER');

  const transaction = await sequelize.transaction();

  try {
    // Degradar al owner actual a admin
    await User.update({ role: 'admin' }, { where: { id: currentOwnerId }, transaction });

    // Promover al nuevo owner
    await User.update({ role: 'owner' }, { where: { id: nuevoOwnerId }, transaction });

    // Actualizar propietarioId en la empresa
    await Company.update({ propietarioId: nuevoOwnerId }, { where: { id: companyId }, transaction });

    await transaction.commit();

    const updated = await User.findByPk(nuevoOwnerId, { attributes: { exclude: ['password'] } });
    return updated.toJSON();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * @description Retorna el perfil completo del usuario autenticado junto con su empresa.
 */
const obtenerPerfil = async (userId) => {
  const user = await User.findByPk(userId, { attributes: { exclude: ['password'] } });
  if (!user) throw new Error('USER_NOT_FOUND');
  const company = await Company.findByPk(user.companyId, { attributes: ['id', 'nombre', 'plan'] });
  return { ...user.toJSON(), company: company?.toJSON() || null };
};

/**
 * @description Actualiza el nombre del usuario autenticado.
 */
const actualizarNombre = async (userId, nombre) => {
  const user = await User.findByPk(userId);
  if (!user) throw new Error('USER_NOT_FOUND');
  await user.update({ nombre });
  const { password, ...safe } = user.toJSON();
  return safe;
};

/**
 * @description Cambia la contraseña del usuario autenticado.
 * Requiere la contraseña actual para confirmar identidad.
 */
const cambiarPassword = async (userId, passwordActual, passwordNuevo) => {
  const bcrypt = require('bcrypt');
  const user = await User.findByPk(userId);
  if (!user) throw new Error('USER_NOT_FOUND');
  const valido = await bcrypt.compare(passwordActual, user.password);
  if (!valido) throw new Error('INVALID_CURRENT_PASSWORD');
  const hashed = await bcrypt.hash(passwordNuevo, 10);
  await user.update({ password: hashed });
};

module.exports = { listarUsuarios, cambiarRol, desactivarUsuario, transferirPropiedad, obtenerPerfil, actualizarNombre, cambiarPassword };
