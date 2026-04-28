import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Plus, MessageSquare, Trash2 } from 'lucide-react';
import { useChatHistory } from '../../hooks/useChatHistory';

export default function ChatSidePanel() {
  const { conversations, activeConversationId } = useSelector(s => s.chatIA);
  const plan = useSelector(s => s.auth.company?.plan || 'free');
  const { fetchConversations, loadConversationById, deleteConversation, newConversation } = useChatHistory();
  const [search, setSearch] = useState('');

  const isPro = plan !== 'free';

  useEffect(() => {
    if (isPro) fetchConversations({ limit: 50 });
  }, [isPro]);

  // Debounce search: filtrado local (sin nueva petición al backend)
  const filtered = conversations.filter(c =>
    !search || (c.title || '').toLowerCase().includes(search.toLowerCase())
  );

  if (!isPro) {
    return (
      <aside className="bg-slate-950 w-60 flex-shrink-0 flex-col border-r border-white/10 hidden lg:flex p-3 gap-2">
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
          <MessageSquare className="w-8 h-8 text-slate-600 mb-3" />
          <p className="text-slate-500 text-xs">El historial de conversaciones está disponible en el plan Pro.</p>
          <a href="/pricing" className="mt-3 text-xs text-blue-400 hover:text-blue-300 transition-colors">
            Actualizar a Pro →
          </a>
        </div>
      </aside>
    );
  }

  return (
    <aside className="bg-slate-950 w-60 flex-shrink-0 flex-col border-r border-white/10 hidden lg:flex flex-col gap-1 p-3">
      <button
        onClick={newConversation}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors duration-150 mb-1"
      >
        <Plus className="w-4 h-4" />
        Nueva conversación
      </button>

      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Buscar..."
        className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300 placeholder-slate-600 outline-none focus:border-blue-500 transition mb-1"
      />

      <div className="flex-1 overflow-y-auto space-y-0.5">
        {filtered.length === 0 && (
          <p className="text-slate-600 text-xs text-center mt-4">Sin conversaciones</p>
        )}
        {filtered.map(conv => (
          <motion.div
            key={conv.id}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            className={`group flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors duration-150 ${
              conv.id === activeConversationId
                ? 'bg-slate-800 text-slate-200 border border-slate-700'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
            onClick={() => loadConversationById(conv.id)}
          >
            <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 text-slate-500" />
            <span className="flex-1 truncate text-xs">
              {conv.title || 'Sin título'}
            </span>
            <button
              onClick={e => { e.stopPropagation(); deleteConversation(conv.id); }}
              className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all flex-shrink-0"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </motion.div>
        ))}
      </div>
    </aside>
  );
}
