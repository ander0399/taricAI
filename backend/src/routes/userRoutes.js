const { Router } = require('express');
const { getUsers, updateRole, deactivateUser, transferOwnership } = require('../controllers/userController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

const router = Router();

/**
 * @description Rutas de gestión de usuarios (todas requieren JWT).
 *
 * GET    /api/users                    — Listar miembros (owner | admin)
 * PATCH  /api/users/:id/role           — Cambiar rol (owner)
 * DELETE /api/users/:id                — Desactivar usuario (owner)
 * POST   /api/users/transfer-ownership — Transferir propiedad (owner)
 */
router.get('/', authenticate, authorize('owner', 'admin'), getUsers);
router.patch('/:id/role', authenticate, authorize('owner'), updateRole);
router.delete('/:id', authenticate, authorize('owner'), deactivateUser);
router.post('/transfer-ownership', authenticate, authorize('owner'), transferOwnership);

module.exports = router;
