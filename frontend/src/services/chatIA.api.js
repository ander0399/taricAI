const API = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function getToken() {
  return sessionStorage.getItem('taricai_token');
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
  };
}

/**
 * @description Inicia una llamada SSE de streaming al endpoint POST /api/chat/message/stream.
 * Retorna el Response object crudo para que useChatIA.js lea el ReadableStream.
 * ⚠️ USAR fetch + ReadableStream — NO EventSource (solo soporta GET).
 * @param {{ content: string, conversationId?: string }} body
 * @returns {Promise<Response>}
 */
export async function streamMessage(body) {
  return fetch(`${API}/chat/message/stream`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
}

/**
 * @description Envía un mensaje sin streaming (fallback JSON).
 * @param {{ content: string, conversationId?: string }} body
 * @returns {Promise<object>}
 */
export async function sendMessage(body) {
  const res = await fetch(`${API}/chat/message`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  return res.json();
}

/**
 * @description Lista conversaciones activas paginadas (Pro+).
 * @param {{ page?: number, limit?: number }} params
 * @returns {Promise<object>}
 */
export async function getConversations(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${API}/chat/conversations${qs ? '?' + qs : ''}`, {
    headers: authHeaders(),
  });
  return res.json();
}

/**
 * @description Carga los mensajes de una conversación (Pro+).
 * @param {string} id - UUID de la conversación
 * @returns {Promise<object>}
 */
export async function getConversation(id) {
  const res = await fetch(`${API}/chat/conversations/${id}`, {
    headers: authHeaders(),
  });
  return res.json();
}

/**
 * @description Actualiza el título de una conversación (Pro+).
 * @param {string} id
 * @param {string} title
 * @returns {Promise<object>}
 */
export async function updateTitle(id, title) {
  const res = await fetch(`${API}/chat/conversations/${id}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ title }),
  });
  return res.json();
}

/**
 * @description Archiva (soft delete) una conversación (Pro+).
 * @param {string} id
 * @returns {Promise<object>}
 */
export async function archiveConversation(id) {
  const res = await fetch(`${API}/chat/conversations/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return res.json();
}

/**
 * @description Obtiene el uso mensual del Chat de IA del usuario.
 * @returns {Promise<{ plan: string, used: number, limit: number, resetDate: string }>}
 */
export async function getUsage() {
  const res = await fetch(`${API}/chat/usage`, {
    headers: authHeaders(),
  });
  return res.json();
}
