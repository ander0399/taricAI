import { motion } from 'framer-motion';
import { Percent, TrendingDown } from 'lucide-react';

/**
 * @description Sección C+D del ResultsPanel — acuerdos comerciales y aranceles e impuestos.
 * Muestra la tasa MFN, tasa preferencial (si aplica acuerdo), IVA, impuestos especiales.
 * @param {{ tariffData: object|null, exporterCountry: string, importerCountry: string }} props
 */
export default function TariffCard({ tariffData, exporterCountry, importerCountry }) {
  if (!tariffData) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-slate-800 border border-slate-700 rounded-2xl p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <Percent className="w-5 h-5 text-blue-400" />
          Aranceles e Impuestos
        </h3>
        <p className="text-slate-400 text-sm">Información arancelaria no disponible para estos países.</p>
      </motion.div>
    );
  }

  const { mfnRate, preferentialRate, tradeAgreement, vat, specialTaxes = [] } = tariffData;
  const hasAgreement = tradeAgreement && preferentialRate;
  const hasSavings = hasAgreement && mfnRate && preferentialRate && mfnRate !== preferentialRate;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-5"
    >
      {/* Acuerdo comercial */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <Percent className="w-5 h-5 text-blue-400" />
          Acuerdos Comerciales
        </h3>
        {hasAgreement ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-emerald-600/20 text-emerald-400 text-sm font-semibold px-3 py-1 rounded-full">
              ✅ Acuerdo activo: {tradeAgreement}
            </span>
            {hasSavings && (
              <span className="bg-blue-600/20 text-blue-300 text-xs px-3 py-1 rounded-full flex items-center gap-1">
                <TrendingDown className="w-3 h-3" /> Ahorro arancelario disponible
              </span>
            )}
          </div>
        ) : (
          <span className="bg-red-600/20 text-red-400 text-sm font-semibold px-3 py-1 rounded-full">
            ❌ Sin acuerdo preferencial {exporterCountry}–{importerCountry}
          </span>
        )}
      </div>

      {/* Tabla de aranceles */}
      <div>
        <h3 className="text-base font-semibold text-white mb-3">Aranceles e Impuestos</h3>
        <div className="bg-slate-900/50 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left text-xs text-slate-400 uppercase font-semibold px-4 py-2.5">Concepto</th>
                <th className="text-right text-xs text-slate-400 uppercase font-semibold px-4 py-2.5">Tasa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {mfnRate && (
                <tr>
                  <td className="px-4 py-3 text-slate-300">Arancel MFN (nación más favorecida)</td>
                  <td className="px-4 py-3 text-right font-mono text-white font-semibold">{mfnRate}</td>
                </tr>
              )}
              {hasAgreement && preferentialRate && (
                <tr className="bg-emerald-900/10">
                  <td className="px-4 py-3 text-slate-300">
                    Arancel preferencial
                    <span className="ml-2 bg-emerald-600/20 text-emerald-400 text-xs px-2 py-0.5 rounded-full">
                      {tradeAgreement}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-emerald-400 font-bold">{preferentialRate}</td>
                </tr>
              )}
              {vat && (
                <tr>
                  <td className="px-4 py-3 text-slate-300">IVA / GST importador</td>
                  <td className="px-4 py-3 text-right font-mono text-white font-semibold">{vat}</td>
                </tr>
              )}
              {specialTaxes.map((tax, i) => (
                <tr key={i}>
                  <td className="px-4 py-3 text-slate-300">{tax.name || `Impuesto especial ${i + 1}`}</td>
                  <td className="px-4 py-3 text-right font-mono text-white font-semibold">{tax.rate || tax}</td>
                </tr>
              ))}
              {!mfnRate && !vat && specialTaxes.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-4 py-4 text-center text-slate-500 text-sm">
                    Tasas específicas no disponibles en las fuentes consultadas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
