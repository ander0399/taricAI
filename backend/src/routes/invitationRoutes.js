const { Router } = require('express');
const { sendInvitation, validateToken, acceptInvitation } = require('../controllers/invitationController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

const router = Router();

/**
 * @description Rutas del sistema de invitaciones.
 *
 * POST /api/invitations/send      — Enviar invitación (requiere JWT + role owner|admin)
 * GET  /api/invitations/validate  — Validar token (pública — accedida desde el email)
 * POST /api/invitations/accept    — Aceptar invitación y crear cuenta (pública)
 */
router.post('/send', authenticate, authorize('owner', 'admin'), sendInvitation);
router.get('/validate', validateToken);
router.post('/accept', acceptInvitation);

module.exports = router;
