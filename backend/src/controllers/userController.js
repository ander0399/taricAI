const userService = require('../services/userService');

const getMe = async (req, res) => {
  try {
    const perfil = await userService.obtenerPerfil(req.user.userId);
    return res.status(200).json({ success: true, data: perfil });
  } catch (error) {
    console.error('[getMe]', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
};

const updateMe = async (req, res) => {
  try {
    const { nombre } = req.body;
    if (!nombre?.trim()) {
      return res.status(400).json({ success: false, message: 'El nombre es requerido.' });
    }
    const user = await userService.actualizarNombre(req.user.userId, nombre.trim());
    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error('[updateMe]', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { passwordActual, passwordNuevo } = req.body;
    if (!passwordActual || !passwordNuevo) {
      return res.status(400).json({ success: false, message: 'passwordActual y passwordNuevo son requeridos.' });
    }
    if (passwordNuevo.length < 6) {
      return res.status(400).json({ success: false, message: 'La nueva contraseña debe tener al menos 6 caracteres.' });
    }
    await userService.cambiarPassword(req.user.userId, passwordActual, passwordNuevo);
    return res.status(200).json({ success: true, message: 'Contraseña actualizada correctamente.' });
  } catch (error) {
    if (error.message === 'INVALID_CURRENT_PASSWORD') {
      return res.status(401).json({ success: false, message: 'La contraseña actual es incorrecta.' });
    }
    console.error('[changePassword]', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
};

/**
 * @description Lista todos los usuarios activos de la empresa del solicitante.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const getUsers = async (req, res) => {
  try {
    const usuarios = await userService.listarUsuarios(req.user.companyId);
    return res.status(200).json({ success: true, data: usuarios });
  } catch (error) {
    console.error('[getUsers]', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
};

/**
 * @description Cambia el rol de un usuario (solo owner puede ejecutar esta acción).
 * @param {import('express').Request} req - Params: { id }  Body: { nuevoRol }
 * @param {import('express').Response} res
 */
const updateRole = async (req, res) => {
  try {
    const { nuevoRol } = req.body;

    if (!nuevoRol) {
      return res.status(400).json({ success: false, message: 'El campo nuevoRol es requerido.' });
    }

    const usuario = await userService.cambiarRol({
      targetUserId: req.params.id,
      nuevoRol,
      requesterId: req.user.userId,
      companyId: req.user.companyId,
    });

    return res.status(200).json({ success: true, message: 'Rol actualizado.', data: usuario });
  } catch (error) {
    const errorMap = {
      USER_NOT_FOUND: [404, 'Usuario no encontrado en tu empresa.'],
      CANNOT_MODIFY_OWNER: [403, 'No puedes modificar el rol del propietario.'],
      CANNOT_MODIFY_SELF: [403, 'No puedes modificar tu propio rol.'],
      INVALID_ROLE: [400, 'Rol inválido. Valores permitidos: admin, member.'],
    };
    const [status, message] = errorMap[error.message] || [500, 'Error interno del servidor.'];
    if (status === 500) console.error('[updateRole]', error);
    return res.status(status).json({ success: false, message });
  }
};

/**
 * @description Desactiva un usuario de la empresa (soft-delete).
 * @param {import('express').Request} req - Params: { id }
 * @param {import('express').Response} res
 */
const deactivateUser = async (req, res) => {
  try {
    await userService.desactivarUsuario({
      targetUserId: req.params.id,
      requesterId: req.user.userId,
      companyId: req.user.companyId,
    });

    return res.status(200).json({ success: true, message: 'Usuario desactivado correctamente.' });
  } catch (error) {
    const errorMap = {
      USER_NOT_FOUND: [404, 'Usuario no encontrado en tu empresa.'],
      CANNOT_DEACTIVATE_OWNER: [403, 'No puedes desactivar al propietario de la empresa.'],
      CANNOT_DEACTIVATE_SELF: [403, 'No puedes desactivarte a ti mismo.'],
    };
    const [status, message] = errorMap[error.message] || [500, 'Error interno del servidor.'];
    if (status === 500) console.error('[deactivateUser]', error);
    return res.status(status).json({ success: false, message });
  }
};

/**
 * @description Transfiere la propiedad de la empresa a otro miembro activo.
 * Solo el owner actual puede ejecutar esta acción.
 * @param {import('express').Request} req - Body: { nuevoOwnerId }
 * @param {import('express').Response} res
 */
const transferOwnership = async (req, res) => {
  try {
    const { nuevoOwnerId } = req.body;

    if (!nuevoOwnerId) {
      return res.status(400).json({ success: false, message: 'El campo nuevoOwnerId es requerido.' });
    }

    const nuevoOwner = await userService.transferirPropiedad({
      nuevoOwnerId,
      currentOwnerId: req.user.userId,
      companyId: req.user.companyId,
    });

    return res.status(200).json({
      success: true,
      message: 'Propiedad transferida correctamente.',
      data: nuevoOwner,
    });
  } catch (error) {
    const errorMap = {
      SAME_USER: [400, 'El nuevo propietario debe ser un usuario diferente a ti.'],
      USER_NOT_FOUND: [404, 'Usuario no encontrado en tu empresa.'],
      ALREADY_OWNER: [400, 'Este usuario ya es el propietario.'],
    };
    const [status, message] = errorMap[error.message] || [500, 'Error interno del servidor.'];
    if (status === 500) console.error('[transferOwnership]', error);
    return res.status(status).json({ success: false, message });
  }
};

module.exports = { getUsers, updateRole, deactivateUser, transferOwnership, getMe, updateMe, changePassword };
