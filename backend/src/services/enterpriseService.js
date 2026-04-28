const transporter = require('../config/email');
const { EnterpriseLeads } = require('../models');

/**
 * @description Guarda el lead Enterprise en la base de datos y dispara un email interno
 *              con todos los datos del formulario al equipo de ventas (SALES_EMAIL).
 * @param {Object} datos
 * @param {string} datos.name - Nombre completo del prospecto
 * @param {string} datos.email - Email corporativo
 * @param {string} datos.company - Empresa u organización
 * @param {string} datos.country - País de operación
 * @param {number} datos.usersCount - Número estimado de usuarios (mínimo 15)
 * @param {string} [datos.volume] - Volumen estimado de operaciones/mes (opcional)
 * @param {string} [datos.message] - Necesidades específicas (opcional)
 * @returns {Promise<void>}
 */
const enviarContactoEnterprise = async ({ name, email, company, country, usersCount, volume, message }) => {
  // Persistir el lead antes de enviar el email — si el email falla el lead queda registrado
  await EnterpriseLeads.create({
    name,
    email,
    company,
    country,
    usersCount: Number(usersCount),
    volume: volume || null,
    message: message || null,
    status: 'new',
  });

  const salesEmail = process.env.SALES_EMAIL || process.env.MAIL_FROM;
  const now = new Date().toLocaleString('es-ES', { timeZone: 'America/Bogota' });

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: salesEmail,
    replyTo: email,
    subject: `[Lead Enterprise] ${name} — ${company} — ${country}`,
    text: `Nuevo lead Enterprise: ${name} (${email}), empresa: ${company}, país: ${country}, usuarios: ${usersCount}, volumen: ${volume || 'No indicado'}, mensaje: ${message || 'Sin mensaje'}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;">
        <h2 style="color:#1a56db;">Nuevo Lead Enterprise — Taric AI</h2>
        <p style="color:#6b7280;font-size:13px;">Recibido el ${now}</p>
        <table style="width:100%;border-collapse:collapse;margin-top:16px;">
          <tr><td style="padding:10px 12px;font-weight:bold;color:#374151;width:40%;background:#f9fafb">Nombre</td><td style="padding:10px 12px;color:#111827">${name}</td></tr>
          <tr><td style="padding:10px 12px;font-weight:bold;color:#374151;background:#f9fafb">Email</td><td style="padding:10px 12px;color:#111827"><a href="mailto:${email}">${email}</a></td></tr>
          <tr><td style="padding:10px 12px;font-weight:bold;color:#374151;background:#f9fafb">Empresa</td><td style="padding:10px 12px;color:#111827">${company}</td></tr>
          <tr><td style="padding:10px 12px;font-weight:bold;color:#374151;background:#f9fafb">País</td><td style="padding:10px 12px;color:#111827">${country}</td></tr>
          <tr><td style="padding:10px 12px;font-weight:bold;color:#374151;background:#f9fafb">Usuarios estimados</td><td style="padding:10px 12px;color:#111827">${usersCount}</td></tr>
          <tr><td style="padding:10px 12px;font-weight:bold;color:#374151;background:#f9fafb">Volumen / mes</td><td style="padding:10px 12px;color:#111827">${volume || 'No indicado'}</td></tr>
        </table>
        ${message ? `
        <div style="margin-top:16px;padding:12px 16px;background:#f3f4f6;border-radius:6px;">
          <p style="font-weight:bold;color:#374151;margin:0 0 8px">Mensaje:</p>
          <p style="color:#111827;margin:0;white-space:pre-wrap">${message}</p>
        </div>` : ''}
        <p style="margin-top:24px;font-size:12px;color:#6b7280;">
          Generado automáticamente desde el formulario Enterprise de taricai.com
        </p>
      </div>
    `,
  });
};

module.exports = { enviarContactoEnterprise };
