const { Router } = require('express');
const { registerOwner, login } = require('../controllers/authController');
const { forgotPassword, resetPassword } = require('../controllers/passwordController');

const router = Router();

/**
 * @description Rutas de autenticación públicas (no requieren JWT).
 * POST /api/auth/register-owner   — Crea empresa + owner en una transacción.
 * POST /api/auth/login            — Autentica usuario y retorna JWT.
 * POST /api/auth/forgot-password  — Solicita enlace de recuperación (15 min).
 * POST /api/auth/reset-password   — Valida token y actualiza contraseña.
 */
router.post('/register-owner', registerOwner);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
