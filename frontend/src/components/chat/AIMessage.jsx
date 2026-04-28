import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { chatIAAnimations } from '../../styles/animations';
import SourcesBadges from './SourcesBadges';

function formatTime(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function AIMessage({ message, isStreaming = false, streamingContent = '' }) {
  const content = isStreaming ? streamingContent : message.content;
  const isOutOfScope = message?.outOfScope;

  return (
    <motion.div
      className="flex justify-start"
      {...chatIAAnimations.messageEnter}
    >
      <div className="max-w-[85%] flex flex-col">
        <div className={`rounded-2xl rounded-bl-sm px-4 py-3 text-sm leading-relaxed ${
          isOutOfScope
            ? 'bg-slate-800 border border-yellow-500/20 text-slate-300'
            : 'bg-slate-800 border border-slate-700 text-slate-200'
        }`}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              // Evitar wraps innecesarios en párrafos para mensajes cortos
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
              li: ({ children }) => <li className="text-slate-200">{children}</li>,
              strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
              code: ({ inline, children }) => inline
                ? <code className="bg-slate-700 text-blue-300 px-1 py-0.5 rounded text-xs font-mono">{children}</code>
                : <pre className="bg-slate-900 border border-slate-700 rounded-lg p-3 overflow-x-auto text-xs font-mono text-slate-300 my-2"><code>{children}</code></pre>,
              table: ({ children }) => <div className="overflow-x-auto my-2"><table className="min-w-full text-xs border-collapse">{children}</table></div>,
              th: ({ children }) => <th className="border border-slate-600 px-2 py-1 bg-slate-700 text-slate-200 font-semibold text-left">{children}</th>,
              td: ({ children }) => <td className="border border-slate-700 px-2 py-1 text-slate-300">{children}</td>,
              blockquote: ({ children }) => <blockquote className="border-l-2 border-yellow-500/60 pl-3 text-yellow-400/80 italic my-2">{children}</blockquote>,
              a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">{children}</a>,
            }}
          >
            {content}
          </ReactMarkdown>
          {isStreaming && (
            <span className="inline-block w-[2px] h-3.5 bg-slate-300 ml-0.5 animate-pulse" />
          )}
        </div>
        {!isStreaming && message?.sourcesUsed?.length > 0 && (
          <SourcesBadges sources={message.sourcesUsed} />
        )}
        {!isStreaming && (
          <span className="text-xs text-slate-500 mt-1">{formatTime(message?.createdAt)}</span>
        )}
      </div>
    </motion.div>
  );
}
