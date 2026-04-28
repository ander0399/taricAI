const { processChat, processChatSync } = require('../services/chat.service');
const { ChatConversations, ChatMessages, Subscription } = require('../models');
const { Op } = require('sequelize');

const isUUID = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

/**
 * @description POST /api/chat/message — Respuesta completa JSON (fallback sin SSE).
 */
async function chat(req, res, next) {
  try {
    const { content, conversationId } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'INVALID_MESSAGE' });
    }
    if (content.trim().length > 4000) {
      return res.status(400).json({ error: 'INVALID_MESSAGE', message: 'El mensaje supera los 4000 caracteres.' });
    }
    if (conversationId && !isUUID(conversationId)) {
      return res.status(400).json({ error: 'INVALID_CONVERSATION_ID' });
    }

    const result = await processChatSync(req);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

/**
 * @description POST /api/chat/message/stream — Respuesta SSE en tiempo real.
 * Las cabeceras SSE se configuran ANTES de cualquier operación async — crítico para Nginx.
 */
async function chatStream(req, res, next) {
  try {
    const { content, conversationId } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'INVALID_MESSAGE' });
    }
    if (content.trim().length > 4000) {
      return res.status(400).json({ error: 'INVALID_MESSAGE', message: 'El mensaje supera los 4000 caracteres.' });
    }
    if (conversationId && !isUUID(conversationId)) {
      return res.status(400).json({ error: 'INVALID_CONVERSATION_ID' });
    }

    // Cabeceras SSE ANTES de cualquier operación async — obligatorio para Nginx
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // desactiva buffer Nginx
    res.flushHeaders();

    await processChat(req, res);
  } catch (err) {
    if (!res.headersSent) return next(err);
    try {
      res.write(`data: ${JSON.stringify({ type: 'error', code: 'SERVER_ERROR' })}\n\n`);
      res.end();
    } catch (_) {}
  }
}

/**
 * @description GET /api/chat/conversations — Lista conversaciones activas paginadas (Pro+).
 */
async function listConversations(req, res, next) {
  try {
    const { companyId } = req.user;
    const page  = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, parseInt(req.query.limit, 10) || 20);
    const offset = (page - 1) * limit;

    // Solo conversaciones del usuario en sesión, activas
    const { count, rows } = await ChatConversations.findAndCountAll({
      where: { userId: req.user.userId, companyId, status: 'active' },
      order: [['updatedAt', 'DESC']],
      limit,
      offset,
      attributes: ['id', 'title', 'language', 'messageCount', 'createdAt', 'updatedAt'],
    });

    res.json({
      success: true,
      conversations: rows,
      pagination: { total: count, page, limit, pages: Math.ceil(count / limit) },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * @description GET /api/chat/conversations/:id — Mensajes completos de una conversación (Pro+).
 */
async function getConversation(req, res, next) {
  try {
    const { id } = req.params;
    const { userId, companyId } = req.user;

    if (!isUUID(id)) return res.status(400).json({ error: 'INVALID_CONVERSATION_ID' });

    const conversation = await ChatConversations.findOne({
      where: { id, companyId, status: 'active' },
    });

    if (!conversation) return res.status(404).json({ error: 'CONVERSATION_NOT_FOUND' });
    // Aislamiento multi-tenant: solo el owner de la empresa puede ver sus conversaciones
    if (conversation.userId !== userId) return res.status(403).json({ error: 'CONVERSATION_NOT_OWNED' });

    const messages = await ChatMessages.findAll({
      where: { conversationId: id },
      order: [['createdAt', 'ASC']],
      attributes: ['id', 'role', 'content', 'language', 'queryType', 'sourcesUsed', 'tokensUsed', 'createdAt'],
    });

    res.json({ success: true, conversation, messages });
  } catch (err) {
    next(err);
  }
}

/**
 * @description PATCH /api/chat/conversations/:id — Actualizar título de la conversación (Pro+).
 */
async function updateTitle(req, res, next) {
  try {
    const { id } = req.params;
    const { title } = req.body;
    const { userId, companyId } = req.user;

    if (!isUUID(id)) return res.status(400).json({ error: 'INVALID_CONVERSATION_ID' });
    if (!title || !title.trim()) return res.status(400).json({ error: 'INVALID_TITLE' });
    if (title.trim().length > 255) return res.status(400).json({ error: 'INVALID_TITLE', message: 'El título supera los 255 caracteres.' });

    const conversation = await ChatConversations.findOne({ where: { id, companyId, status: 'active' } });
    if (!conversation) return res.status(404).json({ error: 'CONVERSATION_NOT_FOUND' });
    if (conversation.userId !== userId) return res.status(403).json({ error: 'CONVERSATION_NOT_OWNED' });

    await conversation.update({ title: title.trim() });
    res.json({ success: true, conversation });
  } catch (err) {
    next(err);
  }
}

/**
 * @description DELETE /api/chat/conversations/:id — Soft delete: status='archived' (Pro+).
 * NUNCA destroy(). Los datos se conservan para auditoría.
 */
async function archiveConversation(req, res, next) {
  try {
    const { id } = req.params;
    const { userId, companyId } = req.user;

    if (!isUUID(id)) return res.status(400).json({ error: 'INVALID_CONVERSATION_ID' });

    const conversation = await ChatConversations.findOne({ where: { id, companyId, status: 'active' } });
    if (!conversation) return res.status(404).json({ error: 'CONVERSATION_NOT_FOUND' });
    if (conversation.userId !== userId) return res.status(403).json({ error: 'CONVERSATION_NOT_OWNED' });

    await conversation.update({ status: 'archived' });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

/**
 * @description GET /api/chat/usage — Consultas usadas en el mes vs límite del plan.
 */
async function getUsage(req, res, next) {
  try {
    const { userId, companyId } = req.user;

    const subscription = await Subscription.findOne({ where: { companyId } });
    const plan = subscription?.plan || 'free';

    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const whereCount = {
      role: 'user',
      createdAt: { [Op.gte]: startOfMonth },
      ...(plan === 'team' ? { companyId } : { userId }),
    };

    const used = await ChatMessages.count({ where: whereCount });

    const LIMITS = { free: 20, pro: 200, team: 2000, enterprise: Infinity };
    const limit = LIMITS[plan] ?? 20;
    const resetDate = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString();

    res.json({ success: true, plan, used, limit, resetDate });
  } catch (err) {
    next(err);
  }
}

module.exports = { chat, chatStream, listConversations, getConversation, updateTitle, archiveConversation, getUsage };
