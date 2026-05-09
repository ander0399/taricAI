/**
 * @description Tabla espejo de tributos exportador vs importador — Sección 9.2 v2.2.
 * Muestra comparación side-by-side de tasas arancelarias, IVA/GST, antidumping
 * y la carga tributaria total estimada.
 *
 * @param {{ taxComparison: object, exporterCountryName: string, importerCountryName: string }} props
 */
export default function TaxComparisonTable({ taxComparison, exporterCountryName, importerCountryName }) {
  if (!taxComparison) return null;

  const { exportSide, importSide, totalEstimatedTaxBurden, divergences = [] } = taxComparison;

  const RateBadge = ({ value }) => {
    if (!value || value === 'null' || value === 'N/A') {
      return <span className="text-yellow-400 text-xs italic">No disponible</span>;
    }
    if (value === 'No aplica') {
      return <span className="bg-slate-700 text-slate-400 border border-slate-600 px-2 py-0.5 rounded text-xs font-mono">No aplica</span>;
    }
    return (
      <span className="font-mono text-blue-300 bg-blue-600/20 border border-blue-500/30 px-2 py-0.5 rounded text-xs">
        {value}
      </span>
    );
  };

  const rows = [
    { label: 'Arancel de exportación',      exp: exportSide?.exportTariff,  imp: null,               impOnly: false, expOnly: true  },
    { label: 'IVA/VAT exportación',         exp: exportSide?.exportVAT,     imp: null,               impOnly: false, expOnly: true  },
    { label: 'Arancel de importación (NMF)',exp: null,                       imp: importSide?.importTariff, impOnly: true, expOnly: false },
    { label: 'IVA/GST importador',          exp: null,                       imp: importSide?.importVAT,   impOnly: true, expOnly: false },
    { label: 'Derechos antidumping',        exp: null,                       imp: importSide?.antidumping, impOnly: true, expOnly: false },
    { label: 'Derechos compensatorios',     exp: null,                       imp: importSide?.countervailing, impOnly: true, expOnly: false },
    { label: 'Impuestos especiales',        exp: exportSide?.specialTaxes,  imp: importSide?.specialTaxes, impOnly: false, expOnly: false },
  ].filter((r) => r.expOnly ? exportSide : r.impOnly ? importSide : (exportSide || importSide));

  return (
    <div className="space-y-3">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-900/50">
              <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3 w-1/3">Concepto</th>
              <th className="text-center text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">
                {exporterCountryName} <span className="normal-case font-normal text-slate-500">(Exportador)</span>
              </th>
              <th className="text-center text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">
                {importerCountryName} <span className="normal-case font-normal text-slate-500">(Importador)</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {rows.map((row, i) => (
              <tr key={i} className="hover:bg-slate-700/20 transition-colors">
                <td className="px-4 py-3 text-sm font-medium text-slate-300 bg-slate-800/50">{row.label}</td>
                <td className="px-4 py-3 text-center">
                  {row.expOnly || (!row.impOnly) ? <RateBadge value={row.exp} /> : <span className="text-slate-600 text-xs">—</span>}
                </td>
                <td className="px-4 py-3 text-center">
                  {row.impOnly || (!row.expOnly) ? <RateBadge value={row.imp} /> : <span className="text-slate-600 text-xs">—</span>}
                </td>
              </tr>
            ))}

            {/* Fila total */}
            {totalEstimatedTaxBurden && (
              <tr className="bg-slate-900/70 border-t-2 border-slate-600">
                <td className="px-4 py-3 text-sm font-semibold text-white">Carga tributaria total estimada</td>
                <td className="px-4 py-3 text-center">
                  <span className="text-slate-500 text-xs">{exportSide?.totalExportCost || '—'}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="font-mono font-bold text-blue-300 text-sm">{totalEstimatedTaxBurden}</span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Divergencias */}
      {divergences.length > 0 && (
        <div className="space-y-1.5">
          {divergences.map((d, i) => (
            <div key={i} className="bg-yellow-600/10 border border-yellow-500/30 rounded-xl px-4 py-2.5 flex items-start gap-2">
              <span className="bg-yellow-600/20 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 mt-0.5">
                Divergencia
              </span>
              <span className="text-yellow-300 text-sm leading-relaxed">{typeof d === 'string' ? d : d.description}</span>
            </div>
          ))}
        </div>
      )}

      {/* Fuentes */}
      <div className="flex flex-wrap gap-3 text-xs text-slate-500">
        {exportSide?.source && <span>Exportador: {exportSide.source}</span>}
        {importSide?.source && <span>• Importador: {importSide.source}</span>}
      </div>
    </div>
  );
}
