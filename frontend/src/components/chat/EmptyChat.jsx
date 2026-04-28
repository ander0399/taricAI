import { motion } from 'framer-motion';
import {
  Globe, Sword, Handshake, Package, FileText,
  Scroll, Scale, DollarSign, BarChart3,
} from 'lucide-react';
import { chatIAAnimations } from '../../styles/animations';
import { CHAT_SUGGESTIONS } from '../../data/chatSuggestions';

const ICONS = { Globe, Sword, Handshake, Package, FileText, Scroll, Scale, DollarSign, BarChart3 };

export default function EmptyChat({ onSuggestionClick }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-8 overflow-y-auto">
      <div className="w-full max-w-2xl">
        <motion.div {...chatIAAnimations.messageEnter} className="text-center mb-8">
          <Globe className="w-10 h-10 text-blue-400 mx-auto mb-3" />
          <h2 className="text-white text-xl font-semibold mb-1">Chat de IA — Comercio Internacional</h2>
          <p className="text-slate-400 text-sm">
            Asesor experto en aduanas, aranceles, tratados, contratos, sanciones y logística global.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {CHAT_SUGGESTIONS.map((cat, catIdx) => {
            const Icon = ICONS[cat.icon] || Globe;
            return (
              <motion.div
                key={catIdx}
                {...chatIAAnimations.suggestionCard(catIdx)}
                className="bg-slate-800 border border-slate-700 rounded-xl p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <span className="text-xs font-semibold text-slate-300">{cat.category}</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  {cat.items.map((text, i) => (
                    <button
                      key={i}
                      onClick={() => onSuggestionClick(text)}
                      className="text-left text-xs text-slate-400 hover:text-slate-200 bg-slate-700/40 hover:bg-slate-700 border border-transparent hover:border-blue-500/30 rounded-lg px-3 py-2 transition-all duration-200 cursor-pointer"
                    >
                      {text}
                    </button>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
