import { useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  addUserMessage, appendChunk, finalizeMessage, finalizeOutOfScope,
  setError, setStatus, setLimitReached,
} from '../store/slices/chatIASlice';
import { streamMessage } from '../services/chatIA.api';

/**
 * @description Hook principal del Chat de IA.
 * Maneja el ciclo completo SSE: fetch → ReadableStream → parsing de chunks → dispatch Redux.
 * ⚠️ Usa fetch + ReadableStream — NO EventSource (que solo soporta GET sin auth headers).
 */
export function useChatIA() {
  const dispatch      = useDispatch();
  const { activeConversationId, status } = useSelector(s => s.chatIA);
  const abortRef = useRef(null);

  const sendMessage = useCallback(async (content) => {
    if (!content?.trim() || status === 'sending' || status === 'streaming') return;

    dispatch(addUserMessage(content.trim()));

    // Cancelar cualquier stream previo en curso
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    let response;
    try {
      response = await streamMessage({
        content: content.trim(),
        conversationId: activeConversationId || undefined,
      });
    } catch {
      dispatch(setError('NETWORK_ERROR'));
      return;
    }

    if (!response.ok) {
      try {
        const err = await response.json();
        if (response.status === 429) {
          dispatch(setLimitReached({ used: err.used, limit: err.limit, resetDate: err.resetDate }));
        } else {
          dispatch(setError(err.error || 'SERVER_ERROR'));
        }
      } catch {
        dispatch(setError('SERVER_ERROR'));
      }
      return;
    }

    const reader  = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer    = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() ?? '';

        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));

            if (data.type === 'chunk') {
              dispatch(appendChunk(data.content));
            } else if (data.type === 'done') {
              if (data.outOfScope) {
                dispatch(finalizeOutOfScope({ content: data.content, conversationId: data.conversationId }));
              } else {
                dispatch(finalizeMessage(data));
              }
            } else if (data.type === 'error') {
              dispatch(setError(data.code || 'STREAM_ERROR'));
            }
          } catch {
            // Fragmento incompleto de SSE — ignorar y continuar
          }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        dispatch(setError('STREAM_INTERRUPTED'));
      }
    }
  }, [dispatch, activeConversationId, status]);

  const retryLastMessage = useCallback(() => {
    dispatch(setStatus('idle'));
    dispatch(setError(null));
  }, [dispatch]);

  const stopStream = useCallback(() => {
    abortRef.current?.abort();
    dispatch(setStatus('idle'));
  }, [dispatch]);

  return { sendMessage, retryLastMessage, stopStream };
}
