import { motion } from 'framer-motion';
import { DollarSign } from 'lucide-react';

/**
 * @description Sección G del ResultsPanel — desglose de costos aduaneros estimados.
 * Valores referenciales basados en aranceles consolidados de fuentes oficiales.
 * @param {{ tariffData: object|null }} props
 */
export default function CostBreakdown({ tariffData }) {
  const costs = tariffData?.estimatedCosts || null;

  const rows = costs ? [
    { label: 'Arancel aduanero',         value: costs.customsDuty,  highlight: false },
    { label: 'IVA / GST importador',      value: costs.vat,          highlight: false },
    { label: 'Tasas portuarias y logística', value: costs.portFees,  highlight: false },
    { label: 'Antidumping / salvaguardias', value: costs.antidumping, highlight: false },
  ].filter(r => r.value) : [];

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

      {rows.length === 0 ? (
        <p className="text-slate-400 text-sm">Estimación de costos no disponible con los datos de fuentes actuales.</p>
      ) : (
        <div className="bg-slate-900/50 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-slate-700/50">
              {rows.map((row, i) => (
                <tr key={i}>
                  <td className="px-4 py-3 text-slate-300">{row.label}</td>
                  <td className="px-4 py-3 text-right font-mono text-white font-semibold">{row.value}</td>
                </tr>
              ))}
              {costs?.total && (
                <tr className="bg-slate-700/30 border-t-2 border-slate-600">
                  <td className="px-4 py-3 text-white font-bold">Total estimado sobre valor CIF</td>
                  <td className="px-4 py-3 text-right font-mono text-blue-300 font-bold text-base">{costs.total}</td>
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
