import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  conversations:        [],
  activeConversationId: null,
  messages:             [],
  streamingContent:     '',
  status: 'idle', // 'idle' | 'sending' | 'streaming' | 'error' | 'limit_reached'
  error:  null,
  usage: {
    used:      0,
    limit:     20,
    plan:      'free',
    resetDate: null,
  },
};

const chatIASlice = createSlice({
  name: 'chatIA',
  initialState,
  reducers: {
    setStatus(state, { payload }) {
      state.status = payload;
      if (payload !== 'error') state.error = null;
    },
    setError(state, { payload }) {
      state.status = 'error';
      state.error  = payload;
    },
    setLimitReached(state, { payload }) {
      state.status = 'limit_reached';
      state.usage  = { ...state.usage, ...payload };
    },

    // Mensajes en la conversación activa
    addUserMessage(state, { payload }) {
      state.messages.push({
        id:        `temp-${Date.now()}`,
        role:      'user',
        content:   payload,
        createdAt: new Date().toISOString(),
      });
      state.streamingContent = '';
      state.status = 'sending';
    },
    appendChunk(state, { payload }) {
      state.streamingContent += payload;
      state.status = 'streaming';
    },
    finalizeMessage(state, { payload }) {
      // payload: { messageId, conversationId, sources, tokensUsed }
      state.messages.push({
        id:         payload.messageId,
        role:       'assistant',
        content:    state.streamingContent,
        sourcesUsed: payload.sources || [],
        createdAt:  new Date().toISOString(),
      });
      state.streamingContent     = '';
      state.activeConversationId = payload.conversationId;
      state.status               = 'idle';
      state.usage.used           = Math.min(state.usage.used + 1, state.usage.limit);
    },
    finalizeOutOfScope(state, { payload }) {
      // payload: { content, conversationId }
      state.messages.push({
        id:        `oos-${Date.now()}`,
        role:      'assistant',
        content:   payload.content,
        outOfScope: true,
        sourcesUsed: [],
        createdAt:  new Date().toISOString(),
      });
      state.streamingContent     = '';
      state.activeConversationId = payload.conversationId;
      state.status               = 'idle';
    },

    // Historial (Pro+)
    setConversations(state, { payload }) {
      state.conversations = payload;
    },
    prependConversation(state, { payload }) {
      state.conversations.unshift(payload);
    },
    updateConversationTitle(state, { payload: { id, title } }) {
      const conv = state.conversations.find(c => c.id === id);
      if (conv) conv.title = title;
    },
    removeConversation(state, { payload: id }) {
      state.conversations = state.conversations.filter(c => c.id !== id);
      if (state.activeConversationId === id) {
        state.activeConversationId = null;
        state.messages = [];
      }
    },

    // Cargar conversación existente
    loadConversation(state, { payload: { conversation, messages } }) {
      state.activeConversationId = conversation.id;
      state.messages             = messages;
      state.streamingContent     = '';
      state.status               = 'idle';
    },

    // Nueva conversación
    startNewConversation(state) {
      state.activeConversationId = null;
      state.messages             = [];
      state.streamingContent     = '';
      state.status               = 'idle';
      state.error                = null;
    },

    // Uso mensual
    setUsage(state, { payload }) {
      state.usage = { ...state.usage, ...payload };
    },
  },
});

export const {
  setStatus, setError, setLimitReached,
  addUserMessage, appendChunk, finalizeMessage, finalizeOutOfScope,
  setConversations, prependConversation, updateConversationTitle, removeConversation,
  loadConversation, startNewConversation,
  setUsage,
} = chatIASlice.actions;

export default chatIASlice.reducer;
