const transporter = require('../config/email');

/**
 * @description Envía el email de invitación al nuevo miembro con el enlace de registro.
 * El token se incluye como query param para que el frontend lo procese en la ruta /accept-invite.
 * @param {{ destinatario: string, nombreEmpresa: string, invitadoPor: string, token: string, rolAsignado: string }} datos
 * @returns {Promise<void>}
 */
const enviarInvitacion = async ({ destinatario, nombreEmpresa, invitadoPor, token, rolAsignado }) => {
  const link = `${process.env.FRONTEND_URL}/accept-invite?token=${token}`;

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: destinatario,
    subject: `Invitación para unirte a ${nombreEmpresa} en TaricAI`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a56db;">Has sido invitado a TaricAI</h2>
        <p><strong>${invitadoPor}</strong> te ha invitado a unirte a <strong>${nombreEmpresa}</strong> como <strong>${rolAsignado}</strong>.</p>
        <p>Haz clic en el botón para crear tu cuenta:</p>
        <a href="${link}" style="display:inline-block;padding:12px 24px;background:#1a56db;color:#fff;border-radius:6px;text-decoration:none;font-weight:bold;">
          Aceptar Invitación
        </a>
        <p style="margin-top:24px;font-size:12px;color:#6b7280;">
          Este enlace expira en 48 horas. Si no esperabas esta invitación, puedes ignorar este email.
        </p>
      </div>
    `,
  });
};

/**
 * @description Envía el email de bienvenida tras completar el registro por invitación.
 * @param {{ destinatario: string, nombre: string, nombreEmpresa: string }} datos
 * @returns {Promise<void>}
 */
const enviarBienvenida = async ({ destinatario, nombre, nombreEmpresa }) => {
  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: destinatario,
    subject: `Bienvenido a TaricAI — ${nombreEmpresa}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a56db;">¡Bienvenido, ${nombre}!</h2>
        <p>Tu cuenta en <strong>${nombreEmpresa}</strong> ha sido creada exitosamente.</p>
        <a href="${process.env.FRONTEND_URL}/dashboard" style="display:inline-block;padding:12px 24px;background:#1a56db;color:#fff;border-radius:6px;text-decoration:none;font-weight:bold;">
          Ir al Dashboard
        </a>
      </div>
    `,
  });
};

/**
 * @description Envía el email de recuperación de contraseña con enlace de un solo uso (15 min).
 * @param {{ destinatario: string, nombre: string, token: string }} datos
 * @returns {Promise<void>}
 */
const enviarResetPassword = async ({ destinatario, nombre, token }) => {
  const link = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: destinatario,
    subject: 'Recuperación de contraseña — TaricAI',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a56db;">Recuperar contraseña</h2>
        <p>Hola <strong>${nombre}</strong>, recibimos una solicitud para restablecer tu contraseña.</p>
        <p>Haz clic en el botón para crear una nueva contraseña:</p>
        <a href="${link}" style="display:inline-block;padding:12px 24px;background:#1a56db;color:#fff;border-radius:6px;text-decoration:none;font-weight:bold;">
          Restablecer Contraseña
        </a>
        <p style="margin-top:24px;font-size:12px;color:#6b7280;">
          Este enlace expira en <strong>15 minutos</strong>. Si no solicitaste esto, ignora este email — tu contraseña no cambiará.
        </p>
      </div>
    `,
  });
};

// ─── EMAILS DE PAGOS Y SUSCRIPCIONES ──────────────────────────────────────────

const PLAN_LABELS = { pro: 'Pro', team: 'Team', enterprise: 'Enterprise' };

/**
 * @description Envía el email de bienvenida tras activar una suscripción de pago.
 *              Se dispara desde el webhook checkout.session.completed — nunca desde el frontend.
 * @param {{ destinatario: string, nombre: string, plan: 'pro'|'team'|'enterprise' }} datos
 * @returns {Promise<void>}
 */
const enviarBienvenidaPlan = async ({ destinatario, nombre, plan }) => {
  const planLabel = PLAN_LABELS[plan] || plan;
  const dashboardUrl = `${process.env.FRONTEND_URL}/dashboard`;

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: destinatario,
    subject: `¡Bienvenido al Plan ${planLabel}! Tu suscripción está activa — TaricAI`,
    text: `Hola ${nombre}, tu suscripción al Plan ${planLabel} de TaricAI está activa. Accede a tu dashboard: ${dashboardUrl}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f172a;color:#f1f5f9;padding:32px;border-radius:12px;">
        <h2 style="color:#3b82f6;margin-bottom:8px;">¡Bienvenido al Plan ${planLabel}!</h2>
        <p style="color:#94a3b8;">Hola <strong style="color:#f1f5f9;">${nombre}</strong>,</p>
        <p style="color:#94a3b8;">Tu suscripción al <strong style="color:#f1f5f9;">Plan ${planLabel}</strong> de TaricAI está ahora activa. Ya puedes acceder a todas las funcionalidades incluidas en tu plan.</p>
        <div style="margin:24px 0;">
          <a href="${dashboardUrl}" style="display:inline-block;padding:12px 28px;background:#3b82f6;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;">
            Ir al Dashboard
          </a>
        </div>
        <p style="font-size:12px;color:#64748b;margin-top:24px;">
          Si tienes preguntas, responde este email o visita nuestro soporte. — El equipo de TaricAI
        </p>
      </div>
    `,
  });
};

/**
 * @description Notifica al owner que un cobro falló y que debe actualizar su método de pago.
 *              Se dispara desde el webhook invoice.payment_failed.
 *              Incluye link al portal de facturación para evitar suspensión del servicio.
 * @param {{ destinatario: string, nombre: string, portalUrl: string }} datos
 * @returns {Promise<void>}
 */
const enviarPagoFallido = async ({ destinatario, nombre, portalUrl }) => {
  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: destinatario,
    subject: '⚠️ Problema con tu pago en TaricAI — acción requerida',
    text: `Hola ${nombre}, hubo un problema al procesar tu pago. Actualiza tu método de pago aquí: ${portalUrl}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f172a;color:#f1f5f9;padding:32px;border-radius:12px;">
        <h2 style="color:#ef4444;margin-bottom:8px;">⚠️ Problema con tu pago</h2>
        <p style="color:#94a3b8;">Hola <strong style="color:#f1f5f9;">${nombre}</strong>,</p>
        <p style="color:#94a3b8;">No pudimos procesar el cobro de tu suscripción TaricAI. Para mantener el acceso a tu plan, actualiza tu método de pago a la brevedad.</p>
        <div style="margin:24px 0;">
          <a href="${portalUrl}" style="display:inline-block;padding:12px 28px;background:#ef4444;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;">
            Actualizar Método de Pago
          </a>
        </div>
        <p style="color:#94a3b8;font-size:14px;">Si el pago no se resuelve, tu cuenta será suspendida automáticamente.</p>
        <p style="font-size:12px;color:#64748b;margin-top:24px;">— El equipo de TaricAI</p>
      </div>
    `,
  });
};

/**
 * @description Notifica al owner que su suscripción fue cancelada y la cuenta degradada a Free.
 *              Se dispara desde el webhook customer.subscription.deleted.
 * @param {{ destinatario: string, nombre: string }} datos
 * @returns {Promise<void>}
 */
const enviarSuscripcionCancelada = async ({ destinatario, nombre }) => {
  const pricingUrl = `${process.env.FRONTEND_URL}/pricing`;

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: destinatario,
    subject: 'Tu suscripción de TaricAI ha sido cancelada',
    text: `Hola ${nombre}, tu suscripción de TaricAI ha sido cancelada. Tu cuenta sigue activa en el Plan Free. Reactiva tu plan aquí: ${pricingUrl}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f172a;color:#f1f5f9;padding:32px;border-radius:12px;">
        <h2 style="color:#f1f5f9;margin-bottom:8px;">Suscripción cancelada</h2>
        <p style="color:#94a3b8;">Hola <strong style="color:#f1f5f9;">${nombre}</strong>,</p>
        <p style="color:#94a3b8;">Tu suscripción de TaricAI ha sido cancelada. Tu cuenta sigue activa pero ahora está en el <strong style="color:#f1f5f9;">Plan Free</strong> con acceso limitado.</p>
        <p style="color:#94a3b8;">Puedes reactivar tu plan en cualquier momento desde nuestra página de precios.</p>
        <div style="margin:24px 0;">
          <a href="${pricingUrl}" style="display:inline-block;padding:12px 28px;background:#3b82f6;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;">
            Ver Planes
          </a>
        </div>
        <p style="font-size:12px;color:#64748b;margin-top:24px;">— El equipo de TaricAI</p>
      </div>
    `,
  });
};

/**
 * @description Envía el recibo de pago tras una renovación exitosa de la suscripción.
 *              Se dispara desde el webhook invoice.payment_succeeded.
 * @param {{ destinatario: string, nombre: string, montoCobrado: string, moneda: string, linkFactura: string, periodEnd: string }} datos
 * @returns {Promise<void>}
 */
const enviarReciboPago = async ({ destinatario, nombre, montoCobrado, moneda, linkFactura, periodEnd }) => {
  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: destinatario,
    subject: `Pago recibido — TaricAI`,
    text: `Hola ${nombre}, recibimos tu pago de ${montoCobrado} ${moneda}. Tu plan está activo hasta el ${periodEnd}. Factura: ${linkFactura}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f172a;color:#f1f5f9;padding:32px;border-radius:12px;">
        <h2 style="color:#22c55e;margin-bottom:8px;">Pago recibido</h2>
        <p style="color:#94a3b8;">Hola <strong style="color:#f1f5f9;">${nombre}</strong>,</p>
        <p style="color:#94a3b8;">Recibimos tu pago de <strong style="color:#f1f5f9;">${montoCobrado} ${moneda}</strong>. Tu suscripción TaricAI está activa hasta el <strong style="color:#f1f5f9;">${periodEnd}</strong>.</p>
        ${linkFactura ? `
        <div style="margin:24px 0;">
          <a href="${linkFactura}" style="display:inline-block;padding:12px 28px;background:#1e293b;border:1px solid #334155;color:#f1f5f9;border-radius:8px;text-decoration:none;font-weight:bold;">
            Ver Factura
          </a>
        </div>` : ''}
        <p style="font-size:12px;color:#64748b;margin-top:24px;">— El equipo de TaricAI</p>
      </div>
    `,
  });
};

/**
 * @description Notifica al owner del Plan Team cuando un nuevo miembro acepta su invitación.
 *              Se dispara desde seat.service.js tras sincronizar el quantity con Stripe.
 * @param {{ destinatario: string, nombreOwner: string, nuevoMiembro: string, emailMiembro: string, totalSeats: number }} datos
 * @returns {Promise<void>}
 */
const enviarNuevoSeat = async ({ destinatario, nombreOwner, nuevoMiembro, emailMiembro, totalSeats }) => {
  const dashboardUrl = `${process.env.FRONTEND_URL}/team`;

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: destinatario,
    subject: `Nuevo miembro agregado a tu equipo — TaricAI`,
    text: `Hola ${nombreOwner}, ${nuevoMiembro} (${emailMiembro}) se unió a tu equipo. Total de seats activos: ${totalSeats}.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0f172a;color:#f1f5f9;padding:32px;border-radius:12px;">
        <h2 style="color:#3b82f6;margin-bottom:8px;">Nuevo miembro en tu equipo</h2>
        <p style="color:#94a3b8;">Hola <strong style="color:#f1f5f9;">${nombreOwner}</strong>,</p>
        <p style="color:#94a3b8;">
          <strong style="color:#f1f5f9;">${nuevoMiembro}</strong> (<a href="mailto:${emailMiembro}" style="color:#3b82f6;">${emailMiembro}</a>)
          acaba de unirse a tu equipo en TaricAI.
        </p>
        <div style="background:#1e293b;border-radius:8px;padding:16px;margin:16px 0;">
          <p style="color:#94a3b8;margin:0;font-size:14px;">
            Seats activos: <strong style="color:#f1f5f9;font-size:18px;">${totalSeats}</strong> / 15
          </p>
          <p style="color:#64748b;margin:4px 0 0;font-size:12px;">
            Stripe aplicará un cargo prorrateado por los días restantes del ciclo de facturación.
          </p>
        </div>
        <a href="${dashboardUrl}" style="display:inline-block;padding:12px 28px;background:#3b82f6;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;">
          Ver Equipo
        </a>
        <p style="font-size:12px;color:#64748b;margin-top:24px;">— El equipo de TaricAI</p>
      </div>
    `,
  });
};

module.exports = {
  enviarInvitacion,
  enviarBienvenida,
  enviarResetPassword,
  enviarBienvenidaPlan,
  enviarPagoFallido,
  enviarSuscripcionCancelada,
  enviarReciboPago,
  enviarNuevoSeat,
};
