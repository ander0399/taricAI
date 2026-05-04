const { Router } = require('express');
const { getUsers, updateRole, deactivateUser, transferOwnership, getMe, updateMe, changePassword } = require('../controllers/userController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

const router = Router();

/**
 * GET    /api/users/me                 — Perfil del usuario autenticado
 * PATCH  /api/users/me                 — Actualizar nombre propio
 * POST   /api/users/me/change-password — Cambiar contraseña propia
 * GET    /api/users                    — Listar miembros (owner | admin)
 * PATCH  /api/users/:id/role           — Cambiar rol (owner)
 * DELETE /api/users/:id                — Desactivar usuario (owner)
 * POST   /api/users/transfer-ownership — Transferir propiedad (owner)
 */
router.get('/me', authenticate, getMe);
router.patch('/me', authenticate, updateMe);
router.post('/me/change-password', authenticate, changePassword);
router.get('/', authenticate, authorize('owner', 'admin'), getUsers);
router.patch('/:id/role', authenticate, authorize('owner'), updateRole);
router.delete('/:id', authenticate, authorize('owner'), deactivateUser);
router.post('/transfer-ownership', authenticate, authorize('owner'), transferOwnership);

module.exports = router;
