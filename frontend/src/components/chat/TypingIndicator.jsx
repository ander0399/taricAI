import { motion } from 'framer-motion';

const DOT_DELAYS = [0, 0.15, 0.30];

export default function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
        {DOT_DELAYS.map((delay, i) => (
          <motion.span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-slate-400 block"
            animate={{ y: [0, -5, 0] }}
            transition={{ repeat: Infinity, duration: 0.85, ease: 'easeInOut', delay }}
          />
        ))}
      </div>
    </div>
  );
}
