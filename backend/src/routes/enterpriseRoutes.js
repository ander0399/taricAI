const { Router } = require('express');
const { contactEnterprise } = require('../controllers/enterpriseController');

const router = Router();

/**
 * POST /api/enterprise/contact
 * Ruta pública — recibe formulario Enterprise y dispara email interno vía Nodemailer.
 */
router.post('/contact', contactEnterprise);

module.exports = router;
