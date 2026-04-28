const authService = require('../services/authService');

/**
 * @description Controlador para el registro del Owner.
 * Crea Empresa + Usuario en una transacción atómica. Punto de entrada SaaS.
 * @param {import('express').Request} req - Body: { nombreEmpresa, plan?, nombre, email, password }
 * @param {import('express').Response} res
 */
const registerOwner = async (req, res) => {
  try {
    const { nombreEmpresa, plan, nombre, email, password } = req.body;

    if (!nombreEmpresa || !nombre || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son requeridos: nombreEmpresa, nombre, email, password.',
      });
    }

    const result = await authService.registerOwner({ nombreEmpresa, plan, nombre, email, password });

    return res.status(201).json({
      success: true,
      message: 'Empresa y propietario creados correctamente.',
      data: result,
    });
  } catch (error) {
    if (error.message === 'EMAIL_ALREADY_EXISTS') {
      return res.status(409).json({ success: false, message: 'El email ya está registrado.' });
    }
    console.error('[registerOwner]', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
};

/**
 * @description Controlador de login. Valida credenciales y retorna JWT + datos de sesión.
 * @param {import('express').Request} req - Body: { email, password }
 * @param {import('express').Response} res
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email y password son requeridos.' });
    }

    const result = await authService.loginUser({ email, password });

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    if (error.message === 'INVALID_CREDENTIALS') {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas.' });
    }
    console.error('[login]', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
};

module.exports = { registerOwner, login };
