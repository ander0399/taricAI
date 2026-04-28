const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware');
const chatLimiter = require('../middlewares/chat.limiter');
const {
  chat,
  chatStream,
  listConversations,
  getConversation,
  updateTitle,
  archiveConversation,
  getUsage,
} = require('../controllers/chat.controller');

// Middleware de plan para rutas Pro+ — inline: solo necesita subscription para verificar plan
const requireProOrAbove = async (req, res, next) => {
  const { Subscription } = require('../models');
  const sub = await Subscription.findOne({ where: { companyId: req.user.companyId } });
  const plan = sub?.plan || 'free';
  if (plan === 'free') {
    return res.status(403).json({
      error: 'FEATURE_NOT_AVAILABLE',
      message: 'El historial de conversaciones requiere el plan Pro o superior.',
      upgradeUrl: '/pricing',
    });
  }
  next();
};

// ── Mensajes (todos los planes) ────────────────────────────────────────────
router.post('/message',        authenticate, chatLimiter, chat);
router.post('/message/stream', authenticate, chatLimiter, chatStream);

// ── Historial (Pro+) ───────────────────────────────────────────────────────
router.get('/conversations',          authenticate, requireProOrAbove, listConversations);
router.get('/conversations/:id',      authenticate, requireProOrAbove, getConversation);
router.patch('/conversations/:id',    authenticate, requireProOrAbove, updateTitle);
router.delete('/conversations/:id',   authenticate, requireProOrAbove, archiveConversation);

// ── Uso del mes (todos los planes) ────────────────────────────────────────
router.get('/usage', authenticate, getUsage);

module.exports = router;
