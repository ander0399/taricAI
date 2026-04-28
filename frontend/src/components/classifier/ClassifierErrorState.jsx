import { motion } from 'framer-motion';
import { AlertOctagon, RotateCcw } from 'lucide-react';

/**
 * @description Estado de error genérico del módulo clasificador.
 * Se muestra cuando la IA o las fuentes fallan tras los reintentos.
 * Diseño según spec sección 5.6: bg-red-900/20, AlertOctagon, botón "Reintentar".
 *
 * @param {{ message?: string, onRetry: Function }} props
 */
export default function ClassifierErrorState({ message, onRetry }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-red-900/20 border border-red-500/30 rounded-xl p-6 flex flex-col items-center text-center gap-4 max-w-md mx-auto"
    >
      <AlertOctagon className="w-8 h-8 text-red-400" />
      <div>
        <p className="text-red-300 font-semibold mb-1">Error en el análisis</p>
        <p className="text-red-400 text-sm leading-relaxed">
          {message || 'Ocurrió un error al procesar tu clasificación. Intenta de nuevo.'}
        </p>
      </div>
      <button
        onClick={onRetry}
        className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-6 py-2.5 font-semibold transition flex items-center gap-2"
      >
        <RotateCcw className="w-4 h-4" />
        Reintentar
      </button>
    </motion.div>
  );
}
