import { motion } from 'framer-motion';
import { chatIAAnimations } from '../../styles/animations';

function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function UserMessage({ message }) {
  return (
    <motion.div
      className="flex justify-end"
      {...chatIAAnimations.messageEnter}
    >
      <div className="max-w-[75%] flex flex-col items-end">
        <div className="bg-blue-600/20 border border-blue-500/30 text-white rounded-2xl rounded-br-sm px-4 py-3 text-sm leading-relaxed">
          {message.content}
        </div>
        <span className="text-xs text-slate-500 mt-1">{formatTime(message.createdAt)}</span>
      </div>
    </motion.div>
  );
}
