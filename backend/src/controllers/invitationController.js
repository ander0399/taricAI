const invitationService = require('../services/invitationService');

/**
 * @description Envía una invitación a un nuevo miembro.
 * Solo accesible por owner o admin. Valida límite de tier antes de proceder.
 * @param {import('express').Request} req - Body: { email, rolAsignado? }
 * @param {import('express').Response} res
 */
const sendInvitation = async (req, res) => {
  try {
    const { email, rolAsignado } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'El campo email es requerido.' });
    }

    const { invitation } = await invitationService.enviarInvitacion_service({
      email,
      rolAsignado,
      companyId: req.user.companyId,
      invitadoPorId: req.user.userId,
    });

    return res.status(201).json({
      success: true,
      message: `Invitación enviada a ${email}.`,
      data: { invitationId: invitation.id, status: invitation.status, expiresAt: invitation.expiresAt },
    });
  } catch (error) {
    const errorMap = {
      COMPANY_NOT_FOUND: [404, 'Empresa no encontrada.'],
      TIER_USER_LIMIT_REACHED: [403, 'Has alcanzado el límite de usuarios de tu plan. Actualiza tu suscripción.'],
      EMAIL_ALREADY_REGISTERED: [409, 'Este email ya tiene una cuenta en TaricAI.'],
      INVITATION_ALREADY_PENDING: [409, 'Ya existe una invitación pendiente para este email.'],
    };

    const [status, message] = errorMap[error.message] || [500, 'Error interno del servidor.'];
    if (status === 500) console.error('[sendInvitation]', error);
    return res.status(status).json({ success: false, message });
  }
};

/**
 * @description Valida un token de invitación y retorna los datos de la empresa.
 * Permite al frontend mostrar a qué empresa se está uniendo el usuario.
 * @param {import('express').Request} req - Query: { token }
 * @param {import('express').Response} res
 */
const validateToken = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ success: false, message: 'Token requerido.' });
    }

    const { invitation, company } = await invitationService.validarToken(token);

    return res.status(200).json({
      success: true,
      data: {
        email: invitation.email,
        rolAsignado: invitation.rolAsignado,
        empresa: company.nombre,
        expiresAt: invitation.expiresAt,
      },
    });
  } catch (error) {
    const errorMap = {
      INVITATION_NOT_FOUND: [404, 'Invitación no encontrada.'],
      INVITATION_INVALID_STATUS: [410, 'Esta invitación ya fue utilizada o cancelada.'],
      INVITATION_EXPIRED: [410, 'Esta invitación ha expirado. Solicita una nueva.'],
    };

    const [status, message] = errorMap[error.message] || [500, 'Error interno del servidor.'];
    if (status === 500) console.error('[validateToken]', error);
    return res.status(status).json({ success: false, message });
  }
};

/**
 * @description Acepta la invitación: crea el usuario y retorna JWT de sesión.
 * @param {import('express').Request} req - Body: { token, nombre, password }
 * @param {import('express').Response} res
 */
const acceptInvitation = async (req, res) => {
  try {
    const { token, nombre, password } = req.body;

    if (!token || !nombre || !password) {
      return res.status(400).json({
        success: false,
        message: 'Campos requeridos: token, nombre, password.',
      });
    }

    const result = await invitationService.aceptarInvitacion({ token, nombre, password });

    return res.status(201).json({
      success: true,
      message: 'Cuenta creada exitosamente. ¡Bienvenido a TaricAI!',
      data: result,
    });
  } catch (error) {
    const errorMap = {
      INVITATION_NOT_FOUND: [404, 'Invitación no encontrada.'],
      INVITATION_INVALID_STATUS: [410, 'Esta invitación ya fue utilizada.'],
      INVITATION_EXPIRED: [410, 'Esta invitación ha expirado.'],
    };

    const [status, message] = errorMap[error.message] || [500, 'Error interno del servidor.'];
    if (status === 500) console.error('[acceptInvitation]', error);
    return res.status(status).json({ success: false, message });
  }
};

module.exports = { sendInvitation, validateToken, acceptInvitation };
