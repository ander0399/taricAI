import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setUsage } from '../../store/slices/chatIASlice';
import { getUsage } from '../../services/chatIA.api';
import ChatSidePanel from './ChatSidePanel';
import ChatWindow from './ChatWindow';

export default function ChatIALayout() {
  const dispatch = useDispatch();

  // Cargar uso mensual al montar el módulo
  useEffect(() => {
    getUsage().then(data => {
      if (data.success) {
        dispatch(setUsage({ used: data.used, limit: data.limit, plan: data.plan, resetDate: data.resetDate }));
      }
    }).catch(() => {});
  }, [dispatch]);

  return (
    <div className="flex h-[calc(100vh-57px)] bg-slate-900">
      <ChatSidePanel />
      <ChatWindow />
    </div>
  );
}
