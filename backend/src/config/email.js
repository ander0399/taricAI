const nodemailer = require('nodemailer');

/**
 * @description Transporter de Nodemailer configurado con las variables de entorno.
 * En desarrollo usa las credenciales SMTP directas; en producción se recomienda un relay dedicado.
 */
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT) || 587,
  secure: false, // STARTTLS
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

module.exports = transporter;
