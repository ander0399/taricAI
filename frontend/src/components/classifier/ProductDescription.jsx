import { useState, useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';

/**
 * @description Paso 4 — confirmar y editar la descripción del producto antes de seleccionar países.
 * Para flujo texto: muestra la descripción ingresada por el usuario.
 * Para flujo imagen/OCR: muestra la descripción generada por gpt-4o (editable).
 * @param {{ description: string, primaryHsCode: string|null, onConfirm: Function, loading: boolean }} props
 */
export default function ProductDescription({ description: initialDesc, primaryHsCode, onConfirm, loading }) {
  const [description, setDescription] = useState(initialDesc || '');
  const edited = description.trim() !== (initialDesc || '').trim();

  useEffect(() => { setDescription(initialDesc || ''); }, [initialDesc]);

  const canSubmit = description.trim().length >= 5 && !loading;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-5">
      {/* Card de producto identificado */}
      <div className="bg-slate-800 border border-emerald-500/30 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-emerald-400 font-semibold text-sm">Producto identificado</span>
          {primaryHsCode && (
            <span className="font-mono bg-blue-600/20 text-blue-300 px-3 py-0.5 rounded-full text-sm ml-auto">
              {primaryHsCode}
            </span>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-400">
            Revisa y enriquece la descripción — más detalle mejora el análisis espejo
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full bg-slate-900/60 border border-slate-600 focus:border-blue-500 focus:outline-none rounded-xl p-4 text-white placeholder-slate-400 resize-none transition text-sm leading-relaxed"
          />
        </div>
      </div>

      <button
        onClick={() => canSubmit && onConfirm(description.trim())}
        disabled={!canSubmit}
        className={`w-full rounded-lg px-8 py-3 font-bold text-lg text-white transition shadow-lg ${
          canSubmit
            ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20'
            : 'bg-slate-700 opacity-50 cursor-not-allowed'
        }`}
      >
        {loading
          ? 'Procesando...'
          : edited
            ? 'Clasificar con descripción corregida'
            : 'Clasificar'}
      </button>
    </div>
  );
}
