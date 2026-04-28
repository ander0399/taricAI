import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import {
  setConversations, loadConversation, updateConversationTitle,
  removeConversation, startNewConversation,
} from '../store/slices/chatIASlice';
import { getConversations, getConversation, updateTitle, archiveConversation } from '../services/chatIA.api';

/**
 * @description Hook para gestionar el historial de conversaciones (Pro+).
 * Encapsula las operaciones CRUD sobre conversaciones.
 */
export function useChatHistory() {
  const dispatch = useDispatch();

  const fetchConversations = useCallback(async (params = {}) => {
    const data = await getConversations(params);
    if (data.success) dispatch(setConversations(data.conversations));
    return data;
  }, [dispatch]);

  const loadConversationById = useCallback(async (id) => {
    const data = await getConversation(id);
    if (data.success) {
      dispatch(loadConversation({ conversation: data.conversation, messages: data.messages }));
    }
    return data;
  }, [dispatch]);

  const renameConversation = useCallback(async (id, title) => {
    const data = await updateTitle(id, title);
    if (data.success) dispatch(updateConversationTitle({ id, title }));
    return data;
  }, [dispatch]);

  const deleteConversation = useCallback(async (id) => {
    const data = await archiveConversation(id);
    if (data.success) dispatch(removeConversation(id));
    return data;
  }, [dispatch]);

  const newConversation = useCallback(() => {
    dispatch(startNewConversation());
  }, [dispatch]);

  return { fetchConversations, loadConversationById, renameConversation, deleteConversation, newConversation };
}
