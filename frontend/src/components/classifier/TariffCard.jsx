import { motion } from 'framer-motion';
import { Percent, TrendingDown } from 'lucide-react';
import { detectVersion } from '../../utils/classification.compat';

/**
 * @description Sección C+D del ResultsPanel — acuerdos comerciales y aranceles e impuestos.
 * Soporta formato legacy (tariffData flat) y v2.2 (resultJson con importer.importDuties).
 * Para plan Pro/Team/Enterprise v2.2 esta sección se omite porque MirrorAnalysis → TaxComparisonTable la reemplaza.
 * @param {{ resultJson: object|null, tariffData: object|null, exporterCountry: string, importerCountry: string }} props
 */
export default function TariffCard({ resultJson, tariffData, exporterCountry, importerCountry }) {
  const version = detectVersion(resultJson);

  // Normalizar datos según versión
  let mfnRate, preferentialRate, tradeAgreement, vat, specialTaxes, hasAgreement;

  if (version === 'v2.2' && resultJson) {
    const duties = resultJson.importer?.importDuties || {};
    const ta     = resultJson.tradeAgreements || {};
    mfnRate          = duties.mfnTariffRate;
    preferentialRate = duties.preferentialTariffRate;
    tradeAgreement   = ta.agreementName;
    vat              = duties.importVAT;
    specialTaxes     = duties.additionalTaxes || [];
    hasAgreement     = ta.hasPreferentialAgreement && ta.agreementName;
  } else if (tariffData) {
    mfnRate          = tariffData.mfnRate;
    preferentialRate = tariffData.preferentialRate;
    tradeAgreement   = tariffData.tradeAgreement;
    vat              = tariffData.vat;
    specialTaxes     = tariffData.specialTaxes || [];
    hasAgreement     = tradeAgreement && preferentialRate;
  } else {
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
            {/* Advertencia acuerdo no verificado v2.2 */}
            {version === 'v2.2' && resultJson?.tradeAgreements?._unverified && (
              <span className="bg-yellow-600/20 text-yellow-400 border border-yellow-500/30 text-xs px-2 py-0.5 rounded-full">
                ⚠️ Verificar en fuente oficial
              </span>
            )}
          </div>
        ) : (
          <span className="bg-red-600/20 text-red-400 text-sm font-semibold px-3 py-1 rounded-full">
            ❌ Sin acuerdo preferencial {exporterCountry}–{importerCountry}
          </span>
        )}
        {version === 'v2.2' && resultJson?.tradeAgreements?.validationNote && (
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">{resultJson.tradeAgreements.validationNote}</p>
        )}
      </div>

      {/* Tabla de aranceles */}
      <div>
        <h3 className="text-base font-semibold text-white mb-3">Aranceles e Impuestos</h3>
        <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-900/50">
                <th className="text-left text-xs text-slate-400 uppercase font-semibold tracking-wider px-4 py-3">Concepto</th>
                <th className="text-left text-xs text-slate-400 uppercase font-semibold tracking-wider px-4 py-3">Tasa</th>
                <th className="text-left text-xs text-slate-400 uppercase font-semibold tracking-wider px-4 py-3 hidden md:table-cell">Fuente</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {mfnRate && (
                <tr className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-4 py-3 text-slate-300">Arancel NMF (nación más favorecida)</td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-blue-300 bg-blue-600/20 border border-blue-500/30 px-2 py-0.5 rounded text-xs">
                      {mfnRate}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 italic hidden md:table-cell">
                    {version === 'v2.2' ? (resultJson?.importer?.importDuties?.source || 'TARIC/EC') : 'Fuentes oficiales'}
                  </td>
                </tr>
              )}
              {hasAgreement && preferentialRate && (
                <tr className="bg-emerald-900/10 hover:bg-emerald-900/20 transition-colors">
                  <td className="px-4 py-3 text-slate-300">
                    Arancel preferencial
                    <span className="ml-2 bg-emerald-600/20 text-emerald-400 text-xs px-2 py-0.5 rounded-full">
                      {tradeAgreement}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-emerald-400 font-bold text-sm">{preferentialRate}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 italic hidden md:table-cell">Acuerdo comercial</td>
                </tr>
              )}
              {vat && (
                <tr className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-4 py-3 text-slate-300">IVA / GST importador</td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-blue-300 bg-blue-600/20 border border-blue-500/30 px-2 py-0.5 rounded text-xs">
                      {vat}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 italic hidden md:table-cell">Autoridad tributaria</td>
                </tr>
              )}
              {specialTaxes.map((tax, i) => (
                <tr key={i} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-4 py-3 text-slate-300">{tax.name || tax.concept || `Impuesto especial ${i + 1}`}</td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-blue-300 bg-blue-600/20 border border-blue-500/30 px-2 py-0.5 rounded text-xs">
                      {tax.rate || tax}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 italic hidden md:table-cell">{tax.source || '—'}</td>
                </tr>
              ))}
              {!mfnRate && !vat && specialTaxes.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-4 text-center text-yellow-400 text-sm italic">
                    No disponible en fuentes consultadas — consultar agente aduanal
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
