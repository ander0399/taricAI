const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const { sequelize, Invitation, User, Company } = require('../models');
const { enviarInvitacion, enviarBienvenida, enviarNuevoSeat } = require('./emailService');
const { generateToken } = require('./authService');
const { syncStripeSeats } = require('./seat.service');
const TIER_LIMITS = require('../config/tiers');

const SALT_ROUNDS = 12;
const INVITE_EXPIRY_HOURS = 48;

/**
 * @description Envía una invitación a un nuevo miembro. Valida:
 * 1. Que el email no esté ya registrado.
 * 2. Que no haya una invitación pendiente para ese email en la empresa.
 * 3. Que el límite de usuarios del tier no se haya alcanzado.
 * @param {{ email: string, rolAsignado: string, companyId: string, invitadoPorId: string }} datos
 * @returns {{ invitation: object }}
 */
const enviarInvitacion_service = async ({ email, rolAsignado = 'member', companyId, invitadoPorId }) => {
  // Cargar empresa para validar tier
  const company = await Company.findByPk(companyId);
  if (!company) throw new Error('COMPANY_NOT_FOUND');

  const limites = TIER_LIMITS[company.plan];

  // Contar usuarios activos en la empresa
  const totalUsuarios = await User.count({ where: { companyId, activo: true } });
  if (totalUsuarios >= limites.usuarios) {
    throw new Error('TIER_USER_LIMIT_REACHED');
  }

  // Verificar que el email no esté ya registrado globalmente
  const usuarioExistente = await User.findOne({ where: { email } });
  if (usuarioExistente) throw new Error('EMAIL_ALREADY_REGISTERED');

  // Verificar que no haya invitación pendiente para ese email en esta empresa
  const invitacionPendiente = await Invitation.findOne({
    where: { email, companyId, status: 'pending' },
  });
  if (invitacionPendiente) throw new Error('INVITATION_ALREADY_PENDING');

  const invitador = await User.findByPk(invitadoPorId);
  if (!invitador) throw new Error('INVITER_NOT_FOUND');

  const token = uuidv4();
  const expiresAt = new Date(Date.now() + INVITE_EXPIRY_HOURS * 60 * 60 * 1000);

  const invitation = await Invitation.create({
    id: uuidv4(),
    email,
    token,
    rolAsignado,
    companyId,
    invitadoPorId,
    status: 'pending',
    expiresAt,
  });

  await enviarInvitacion({
    destinatario: email,
    nombreEmpresa: company.nombre,
    invitadoPor: invitador.nombre,
    token,
    rolAsignado,
  });

  return { invitation };
};

/**
 * @description Valida un token de invitación. Retorna los datos de la invitación si es válido.
 * Marca como 'expired' si el tiempo de vida fue superado.
 * @param {string} token - UUID del token de invitación
 * @returns {{ invitation: object, company: object }}
 */
const validarToken = async (token) => {
  const invitation = await Invitation.findOne({
    where: { token },
    include: [{ association: 'empresa' }],
  });

  if (!invitation) throw new Error('INVITATION_NOT_FOUND');

  if (invitation.status !== 'pending') throw new Error('INVITATION_INVALID_STATUS');

  if (new Date() > invitation.expiresAt) {
    await invitation.update({ status: 'expired' });
    throw new Error('INVITATION_EXPIRED');
  }

  return { invitation, company: invitation.empresa };
};

/**
 * @description Acepta una invitación: crea el usuario, marca la invitación como aceptada
 * y envía el email de bienvenida. Todo en una transacción atómica.
 * @param {{ token: string, nombre: string, password: string }} datos
 * @returns {{ user: object, company: object, token: string }}
 */
const aceptarInvitacion = async ({ token, nombre, password }) => {
  const { invitation, company } = await validarToken(token);

  const transaction = await sequelize.transaction();

  try {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await User.create(
      {
        id: uuidv4(),
        nombre,
        email: invitation.email,
        password: passwordHash,
        role: invitation.rolAsignado,
        companyId: invitation.companyId,
      },
      { transaction }
    );

    await invitation.update({ status: 'accepted' }, { transaction });

    await transaction.commit();

    // Operaciones fuera de la transacción — un fallo aquí no revierte el registro del usuario

    // Email de bienvenida
    await enviarBienvenida({ destinatario: user.email, nombre: user.nombre, nombreEmpresa: company.nombre });

    // Trigger de seats: sincronizar quantity en Stripe si la empresa es Plan Team
    // Se ejecuta después de commit porque User.activo=true ya es visible en la DB
    try {
      await syncStripeSeats(invitation.companyId);

      // Notificar al owner solo si la empresa es Plan Team (syncStripeSeats es no-op en otros planes)
      const companyActualizada = await Company.findByPk(invitation.companyId);
      if (companyActualizada?.plan === 'team') {
        const { Subscription } = require('../models');
        const sub = await Subscription.findOne({ where: { companyId: invitation.companyId } });
        const owner = await User.findOne({
          where: { companyId: invitation.companyId, role: 'owner' },
        });
        if (owner) {
          await enviarNuevoSeat({
            destinatario: owner.email,
            nombreOwner: owner.nombre,
            nuevoMiembro: user.nombre,
            emailMiembro: user.email,
            totalSeats: sub?.quantity ?? 1,
          });
        }
      }
    } catch (seatError) {
      // Un fallo de Stripe o del email no debe bloquear el acceso del usuario recién registrado
      console.error('[Seats] Error al sincronizar seats o enviar email tras aceptar invitación:', seatError.message);
    }

    const { password: _, ...safeUser } = user.toJSON();
    const jwt = generateToken({ userId: user.id, companyId: company.id, role: user.role });

    return { token: jwt, user: safeUser, company: company.toJSON() };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

module.exports = { enviarInvitacion_service, validarToken, aceptarInvitacion };
