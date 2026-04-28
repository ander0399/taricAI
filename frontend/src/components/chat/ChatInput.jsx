import { useState, useRef, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Send } from 'lucide-react';

const MAX_CHARS = 4000;
const SHOW_COUNTER_AT = 3500;

/**
 * @description Textarea autoexpandible para el Chat de IA.
 * Enter = enviar · Shift+Enter = nueva línea.
 * Deshabilitado durante 'sending' y 'streaming'.
 */
export default function ChatInput({ onSend, externalValue, onExternalValueConsumed }) {
  const [value, setValue] = useState('');
  const textareaRef = useRef(null);
  const status = useSelector(s => s.chatIA.status);
  const isDisabled = status === 'sending' || status === 'streaming' || status === 'limit_reached';

  // Insertar sugerencia desde EmptyChat sin enviar
  useEffect(() => {
    if (externalValue) {
      setValue(externalValue);
      onExternalValueConsumed?.();
      setTimeout(() => textareaRef.current?.focus(), 0);
    }
  }, [externalValue, onExternalValueConsumed]);

  // Auto-resize del textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || isDisabled) return;
    onSend(trimmed);
    setValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [value, isDisabled, onSend]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const showCounter = value.length > SHOW_COUNTER_AT;
  const overLimit   = value.length > MAX_CHARS;

  return (
    <div className="p-4 border-t border-white/10">
      <div className="flex items-end gap-3">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={e => setValue(e.target.value.slice(0, MAX_CHARS))}
            onKeyDown={handleKeyDown}
            disabled={isDisabled}
            placeholder={isDisabled ? 'Generando respuesta...' : 'Escribe tu consulta de comercio internacional...'}
            rows={1}
            className="bg-slate-800 border border-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 rounded-xl px-4 py-3 text-white placeholder-slate-500 outline-none transition resize-none min-h-[48px] max-h-[200px] w-full text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {showCounter && (
            <span className={`absolute bottom-2 right-3 text-xs ${overLimit ? 'text-red-400' : 'text-slate-500'}`}>
              {value.length}/{MAX_CHARS}
            </span>
          )}
        </div>
        <button
          onClick={handleSend}
          disabled={isDisabled || !value.trim() || overLimit}
          className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl p-2.5 transition-colors duration-200 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
      <p className="text-xs text-slate-600 mt-2 text-center">
        Enter para enviar · Shift+Enter para nueva línea
      </p>
    </div>
  );
}
