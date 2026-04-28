import { useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import UserMessage from './UserMessage';
import AIMessage from './AIMessage';
import TypingIndicator from './TypingIndicator';
import EmptyChat from './EmptyChat';

export default function MessageList({ onSuggestionClick }) {
  const { messages, streamingContent, status } = useSelector(s => s.chatIA);
  const bottomRef = useRef(null);

  // Auto-scroll al fondo en cada nuevo contenido
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const isEmpty = messages.length === 0 && status === 'idle';

  if (isEmpty) {
    return (
      <div className="flex-1 overflow-y-auto">
        <EmptyChat onSuggestionClick={onSuggestionClick} />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      <AnimatePresence initial={false}>
        {messages.map(msg =>
          msg.role === 'user'
            ? <UserMessage key={msg.id} message={msg} />
            : <AIMessage key={msg.id} message={msg} />
        )}

        {/* Indicador de tipeo mientras espera el primer chunk */}
        {status === 'sending' && <TypingIndicator key="typing" />}

        {/* Mensaje del asistente en construcción durante streaming */}
        {status === 'streaming' && streamingContent && (
          <AIMessage
            key="streaming"
            message={{ role: 'assistant', content: '' }}
            isStreaming
            streamingContent={streamingContent}
          />
        )}
      </AnimatePresence>
      <div ref={bottomRef} />
    </div>
  );
}
