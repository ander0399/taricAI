import { motion } from 'framer-motion';
import { DollarSign } from 'lucide-react';
import { detectVersion, getCostItems } from '../../utils/classification.compat';

/**
 * @description Sección G del ResultsPanel — desglose de costos aduaneros estimados.
 * Soporta formato legacy y v2.2. Muestra tasas REALES, no placeholders.
 * @param {{ resultJson: object|null }} props
 */
export default function CostBreakdown({ resultJson }) {
  const version  = detectVersion(resultJson);
  const items    = getCostItems(resultJson, version);
  const currency = version === 'v2.2' ? (resultJson?.costBreakdown?.currency || 'USD') : 'USD';
  const basedOn  = version === 'v2.2' ? (resultJson?.costBreakdown?.basedOnValue || 'CIF') : 'CIF';

  // Calcular carga total sumando tasas porcentuales conocidas
  const totalBurden = version === 'v2.2'
    ? items.reduce((acc, item) => {
        const match = typeof item.rate === 'string' ? item.rate.match(/(\d+(?:\.\d+)?)%/) : null;
        return match ? acc + parseFloat(match[1]) : acc;
      }, 0)
    : null;

  const RATE_BADGE = (rate) => {
    if (!rate || rate === 'null') return <span className="text-yellow-400 text-xs italic">No disponible — consultar agente</span>;
    if (rate === 'Variable')    return <span className="bg-yellow-600/20 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded text-xs font-mono">Variable</span>;
    if (rate === 'No aplica')   return <span className="bg-slate-700 text-slate-400 border border-slate-600 px-2 py-0.5 rounded text-xs font-mono">No aplica</span>;
    return <span className="font-mono text-blue-300 bg-blue-600/20 border border-blue-500/30 px-2 py-0.5 rounded text-xs">{rate}</span>;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-slate-800 border border-slate-700 rounded-2xl p-6"
    >
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <DollarSign className="w-5 h-5 text-blue-400" />
        Desglose de Costos Estimados
      </h3>

      {items.length === 0 ? (
        <p className="text-slate-400 text-sm">
          Estimación de costos no disponible con los datos de fuentes actuales.
        </p>
      ) : (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-900/50">
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Concepto</th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Tasa</th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3 hidden md:table-cell">Base de cálculo</th>
                <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3 hidden lg:table-cell">Fuente</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {items.map((item, i) => (
                <tr key={i} className="border-t border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                  <td className="px-4 py-3 text-sm text-slate-300">{item.concept || item.label}</td>
                  <td className="px-4 py-3 text-sm">{RATE_BADGE(item.rate || item.value)}</td>
                  <td className="px-4 py-3 text-xs text-slate-400 hidden md:table-cell">{item.calculation || `Sobre valor ${basedOn}`}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 italic hidden lg:table-cell">{item.source || 'Fuentes oficiales'}</td>
                </tr>
              ))}
              {totalBurden > 0 && (
                <tr className="bg-slate-900/70 border-t-2 border-slate-600">
                  <td className="px-4 py-3 text-sm font-semibold text-white" colSpan={2}>
                    Carga tributaria total estimada
                    <span className="font-mono text-blue-300 ml-3">~{totalBurden}% sobre valor {basedOn}</span>
                  </td>
                  <td className="hidden md:table-cell" />
                  <td className="hidden lg:table-cell" />
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-slate-500 mt-3">
        * Valores referenciales basados en fuentes oficiales. Confirmar con agente de carga o despachante de aduana.
      </p>
    </motion.div>
  );
}
