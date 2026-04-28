import { useState } from 'react';

const MIN_CHARS = 30;

/**
 * @description Paso 2A — textarea para descripción del producto.
 * Muestra advertencia si el texto es muy corto (< 30 chars) para mejorar la precisión.
 * @param {{ onAnalyze: Function, loading: boolean }} props
 */
export default function TextClassifier({ onAnalyze, loading }) {
  const [description, setDescription] = useState('');
  const tooShort = description.trim().length > 0 && description.trim().length < MIN_CHARS;
  const canSubmit = description.trim().length >= 5 && !loading;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Describe tu producto</h2>
        <p className="text-slate-400 text-sm">Más detalle mejora la precisión arancelaria</p>
      </div>

      <div className="space-y-2">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe tu producto con el mayor detalle posible. Ejemplo: 'Silla ergonómica de oficina con respaldo de malla, estructura de aluminio y ruedas de nylon, color negro, peso 12 kg, uso doméstico'"
          className="w-full h-36 bg-slate-800 border border-slate-600 focus:border-blue-500 focus:outline-none rounded-xl p-4 text-white placeholder-slate-400 resize-none transition"
        />
        <div className="flex items-center justify-between text-xs">
          {tooShort ? (
            <span className="text-yellow-400">Más detalle mejora la precisión</span>
          ) : (
            <span className="text-slate-500">Mínimo 5 caracteres</span>
          )}
          <span className="text-slate-500">{description.length} chars</span>
        </div>
      </div>

      <button
        onClick={() => canSubmit && onAnalyze(description.trim())}
        disabled={!canSubmit}
        className={`w-full rounded-lg py-3 font-bold text-white transition ${
          canSubmit
            ? 'bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20'
            : 'bg-slate-700 opacity-50 cursor-not-allowed'
        }`}
      >
        {loading ? 'Analizando...' : 'Analizar descripción'}
      </button>
    </div>
  );
}
