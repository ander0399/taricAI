const OpenAI = require('openai');
const { ChatConversations, ChatMessages } = require('../models');
const { detectLanguage } = require('./chatLanguage.service');
const { validateAndClassify, getOutOfScopeMessage } = require('./chatScope.service');
const { buildSystemPrompt } = require('./chatPrompt.service');
const { needsRealTimeData, selectSources, fetchSources, extractContext } = require('./chatSources.service');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const MAIN_MODEL  = process.env.CHAT_MAIN_MODEL  || 'gpt-4o';
const GUARD_MODEL = process.env.CHAT_GUARD_MODEL || 'gpt-4o-mini';
const TEMPERATURE = parseFloat(process.env.CHAT_TEMPERATURE) || 0.3;
const CONTEXT_WINDOW = parseInt(process.env.CHAT_CONTEXT_WINDOW_MESSAGES, 10) || 20;

/**
 * @description Orquestador principal del Chat de IA — 9 pasos secuenciales con SSE streaming.
 * Flujo: idioma → scope+queryType → historial → fuentes → system prompt → GPT-4o → persistencia.
 * @param {import('express').Request} req - Debe tener req.user, req.chatPlan y body { content, conversationId? }
 * @param {import('express').Response} res - Conexión SSE ya abierta por el controller
 */
async function processChat(req, res) {
  const startTime = Date.now();
  const { userId, companyId } = req.user;
  const { content: message, conversationId: requestedConvId } = req.body;

  // ─── PASO 1: Detectar idioma del mensaje ─────────────────────────────────
  let conversation = null;
  if (requestedConvId) {
    conversation = await ChatConversations.findOne({
      where: { id: requestedConvId, companyId, status: 'active' },
    });
    if (!conversation) {
      res.write(`data: ${JSON.stringify({ type: 'error', code: 'CONVERSATION_NOT_FOUND' })}\n\n`);
      return res.end();
    }
  }

  const lang = detectLanguage(message, conversation?.language || null);

  // ─── PASO 2+3: Scope + queryType + países (UNA llamada a gpt-4o-mini) ────
  const { scope, queryType, countries } = await validateAndClassify(message);

  if (scope === 'OUT_OF_SCOPE') {
    // Crear/actualizar conversación y guardar solo el mensaje del usuario
    if (!conversation) {
      conversation = await ChatConversations.create({ userId, companyId, language: lang.code });
    }
    await ChatMessages.create({
      conversationId: conversation.id,
      userId, companyId,
      role: 'user',
      content: message,
      language: lang.code,
      queryType: 'out_of_scope',
    });

    const restrictionMsg = getOutOfScopeMessage(lang.name, lang.code);
    res.write(`data: ${JSON.stringify({
      type: 'done',
      content: restrictionMsg,
      conversationId: conversation.id,
      sources: [],
      outOfScope: true,
    })}\n\n`);
    return res.end();
  }

  // ─── PASO 4: Crear conversación si no existe ─────────────────────────────
  if (!conversation) {
    conversation = await ChatConversations.create({ userId, companyId, language: lang.code });
  }

  // ─── PASO 5: Recuperar historial (ventana de contexto controlada) ─────────
  const history = await ChatMessages.findAll({
    where: { conversationId: conversation.id },
    order: [['createdAt', 'ASC']],
    limit: CONTEXT_WINDOW,
    attributes: ['role', 'content'],
  });

  // ─── PASO 6: Scraping de fuentes (condicional) ────────────────────────────
  let sourcesContext = '';
  let fetchedSources = [];
  if (needsRealTimeData(message, queryType)) {
    const selectedSources = selectSources({ queryType, countries });
    fetchedSources = await fetchSources(selectedSources);
    sourcesContext = extractContext(fetchedSources);
  }

  // ─── PASO 7: Construir system prompt con idioma + fuentes ─────────────────
  const systemPrompt = buildSystemPrompt({
    languageCode: lang.code,
    languageName:  lang.name,
    sourcesContext,
  });

  // ─── PASO 8: Stream GPT-4o ────────────────────────────────────────────────
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: message },
  ];

  let fullResponse = '';
  let usage = null;

  try {
    const stream = await openai.chat.completions.create({
      model: MAIN_MODEL,
      temperature: TEMPERATURE,
      messages,
      stream: true,
      stream_options: { include_usage: true },
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        fullResponse += delta;
        res.write(`data: ${JSON.stringify({ type: 'chunk', content: delta })}\n\n`);
      }
      if (chunk.usage) usage = chunk.usage;
    }
  } catch (err) {
    res.write(`data: ${JSON.stringify({ type: 'error', code: 'OPENAI_STREAM_ERROR' })}\n\n`);
    return res.end();
  }

  // ─── PASO 9: Persistir mensajes + actualizar conversación ─────────────────
  const responseTimeMs = Date.now() - startTime;
  const sourcesForDB = fetchedSources
    .filter(s => s.status === 'ok')
    .map(({ url, name, country, countryCode, fetchedAt, status }) =>
      ({ url, name, country, countryCode, fetchedAt, status })
    );

  await ChatMessages.create({
    conversationId: conversation.id,
    userId, companyId,
    role: 'user',
    content: message,
    language: lang.code,
    queryType,
  });

  const savedAssistant = await ChatMessages.create({
    conversationId: conversation.id,
    userId, companyId,
    role: 'assistant',
    content: fullResponse,
    language: lang.code,
    queryType,
    sourcesUsed: sourcesForDB.length ? sourcesForDB : null,
    tokensUsed: usage?.total_tokens ?? null,
    responseTimeMs,
  });

  await conversation.increment('messageCount', { by: 2 });

  // Auto-generar título en la primera respuesta
  const isFirstExchange = history.length === 0;
  if (isFirstExchange) {
    const titleResponse = await openai.chat.completions.create({
      model: GUARD_MODEL,
      temperature: 0,
      max_tokens: 15,
      messages: [
        {
          role: 'user',
          content: `Genera un título conciso (máximo 8 palabras, sin comillas) para una conversación que empieza con este mensaje: "${message.slice(0, 200)}"`,
        },
      ],
    });
    const title = titleResponse.choices[0]?.message?.content?.trim().slice(0, 60) || message.slice(0, 60);
    await conversation.update({ title, language: lang.code });
  }

  res.write(`data: ${JSON.stringify({
    type: 'done',
    messageId: savedAssistant.id,
    conversationId: conversation.id,
    sources: sourcesForDB,
    tokensUsed: usage?.total_tokens ?? null,
  })}\n\n`);
  res.end();
}

/**
 * @description Versión no-streaming del chat (fallback para entornos sin soporte SSE).
 * Retorna la respuesta completa como JSON.
 * @param {import('express').Request} req
 * @returns {Promise<object>} - { content, conversationId, sources, tokensUsed }
 */
async function processChatSync(req) {
  const startTime = Date.now();
  const { userId, companyId } = req.user;
  const { content: message, conversationId: requestedConvId } = req.body;

  let conversation = null;
  if (requestedConvId) {
    conversation = await ChatConversations.findOne({
      where: { id: requestedConvId, companyId, status: 'active' },
    });
    if (!conversation) throw Object.assign(new Error('CONVERSATION_NOT_FOUND'), { status: 404 });
  }

  const lang = detectLanguage(message, conversation?.language || null);
  const { scope, queryType, countries } = await validateAndClassify(message);

  if (!conversation) {
    conversation = await ChatConversations.create({ userId, companyId, language: lang.code });
  }

  if (scope === 'OUT_OF_SCOPE') {
    await ChatMessages.create({
      conversationId: conversation.id, userId, companyId,
      role: 'user', content: message, language: lang.code, queryType: 'out_of_scope',
    });
    return {
      content: getOutOfScopeMessage(lang.name, lang.code),
      conversationId: conversation.id,
      sources: [],
      outOfScope: true,
    };
  }

  const history = await ChatMessages.findAll({
    where: { conversationId: conversation.id },
    order: [['createdAt', 'ASC']],
    limit: CONTEXT_WINDOW,
    attributes: ['role', 'content'],
  });

  let sourcesContext = '';
  let fetchedSources = [];
  if (needsRealTimeData(message, queryType)) {
    const selected = selectSources({ queryType, countries });
    fetchedSources = await fetchSources(selected);
    sourcesContext = extractContext(fetchedSources);
  }

  const systemPrompt = buildSystemPrompt({ languageCode: lang.code, languageName: lang.name, sourcesContext });

  const response = await openai.chat.completions.create({
    model: MAIN_MODEL,
    temperature: TEMPERATURE,
    messages: [
      { role: 'system', content: systemPrompt },
      ...history.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: message },
    ],
  });

  const fullResponse = response.choices[0].message.content;
  const responseTimeMs = Date.now() - startTime;
  const sourcesForDB = fetchedSources.filter(s => s.status === 'ok')
    .map(({ url, name, country, countryCode, fetchedAt, status }) => ({ url, name, country, countryCode, fetchedAt, status }));

  await ChatMessages.create({ conversationId: conversation.id, userId, companyId, role: 'user', content: message, language: lang.code, queryType });
  const saved = await ChatMessages.create({
    conversationId: conversation.id, userId, companyId,
    role: 'assistant', content: fullResponse, language: lang.code, queryType,
    sourcesUsed: sourcesForDB.length ? sourcesForDB : null,
    tokensUsed: response.usage?.total_tokens ?? null,
    responseTimeMs,
  });
  await conversation.increment('messageCount', { by: 2 });

  if (history.length === 0) {
    const titleRes = await openai.chat.completions.create({
      model: GUARD_MODEL, temperature: 0, max_tokens: 15,
      messages: [{ role: 'user', content: `Título conciso (máx 8 palabras): "${message.slice(0, 200)}"` }],
    });
    const title = titleRes.choices[0]?.message?.content?.trim().slice(0, 60) || message.slice(0, 60);
    await conversation.update({ title, language: lang.code });
  }

  return { content: fullResponse, conversationId: conversation.id, messageId: saved.id, sources: sourcesForDB, tokensUsed: response.usage?.total_tokens ?? null };
}

module.exports = { processChat, processChatSync };
