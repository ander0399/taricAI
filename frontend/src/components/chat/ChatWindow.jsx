import { useState } from 'react';
import { useSelector } from 'react-redux';
import { AlertTriangle, ArrowUpRight } from 'lucide-react';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import { useChatIA } from '../../hooks/useChatIA';

export default function ChatWindow() {
  const { sendMessage } = useChatIA();
  const status = useSelector(s => s.chatIA.status);
  const error  = useSelector(s => s.chatIA.error);
  const { used, limit } = useSelector(s => s.chatIA.usage);

  const [pendingSuggestion, setPendingSuggestion] = useState('');

  const handleSuggestionClick = (text) => setPendingSuggestion(text);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <ChatHeader />

      {/* Banner de límite alcanzado */}
      {status === 'limit_reached' && (
        <div className="mx-4 mt-3 bg-yellow-600/10 border border-yellow-500/30 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-yellow-400 text-sm font-medium">Límite mensual alcanzado</p>
            <p className="text-yellow-400/70 text-xs mt-0.5">
              Has usado {used}/{limit} consultas este mes.
            </p>
          </div>
          <a
            href="/pricing"
            className="flex items-center gap-1 bg-yellow-600 hover:bg-yellow-500 text-black rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors flex-shrink-0"
          >
            Mejorar plan <ArrowUpRight className="w-3 h-3" />
          </a>
        </div>
      )}

      {/* Banner de error */}
      {status === 'error' && error && (
        <div className="mx-4 mt-3 bg-red-600/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-xs">
          Error: {error}. Intenta de nuevo.
        </div>
      )}

      <MessageList onSuggestionClick={handleSuggestionClick} />

      <ChatInput
        onSend={sendMessage}
        externalValue={pendingSuggestion}
        onExternalValueConsumed={() => setPendingSuggestion('')}
      />
    </div>
  );
}
