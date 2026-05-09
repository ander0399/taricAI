import { AlertTriangle } from 'lucide-react';

const APPLIES_BADGE  = 'bg-red-600/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full text-xs font-semibold';
const NO_BADGE       = 'bg-slate-700 text-slate-400 border border-slate-600 px-2 py-0.5 rounded-full text-xs';
const VERIFY_BADGE   = 'bg-yellow-600/20 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-full text-xs font-semibold';

function NTBBadge({ applies, details }) {
  if (applies === true)  return <span className={APPLIES_BADGE}>Aplica</span>;
  if (applies === false) return <span className={NO_BADGE}>No aplica</span>;
  return <span className={VERIFY_BADGE}>Verificar</span>;
}

const NTB_ROWS = [
  { key: 'sanitaryPhytosanitary', label: 'Sanitario / Fitosanitario' },
  { key: 'technicalBarriers',     label: 'Barreras técnicas' },
  { key: 'environmentalRegulations', label: 'Regulaciones ambientales' },
  { key: 'exportControls',        label: 'Control de exportaciones' },
  { key: 'quotas',                label: 'Cuotas / Contingentes' },
  { key: 'embargoes',             label: 'Embargos / Sanciones' },
  { key: 'antidumping',           label: 'Antidumping' },
];

/**
 * @description Comparación de barreras no arancelarias (NTBs) espejo exportador/importador.
 * Muestra tabla de requisitos por categoría + sección de divergencias con recomendaciones.
 *
 * @param {{ ntbComparison: object, exporterCountryName: string, importerCountryName: string }} props
 */
export default function NTBComparison({ ntbComparison, exporterCountryName, importerCountryName }) {
  if (!ntbComparison) return null;

  const { exporterNTBs = {}, importerNTBs = {}, divergences = [] } = ntbComparison;

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-4">
      <h4 className="text-base font-semibold text-white flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-yellow-400" />
        Requisitos No Arancelarios (NTBs)
      </h4>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-900/50">
              <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3 w-1/3">Área</th>
              <th className="text-center text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">
                {exporterCountryName}
              </th>
              <th className="text-center text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">
                {importerCountryName}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {NTB_ROWS.map((row) => {
              const expNTB = exporterNTBs[row.key];
              const impNTB = importerNTBs[row.key];
              return (
                <tr key={row.key} className="hover:bg-slate-700/20 transition-colors">
                  <td className="px-4 py-3 text-sm text-slate-300 font-medium bg-slate-800/50">{row.label}</td>
                  <td className="px-4 py-3 text-center">
                    {expNTB ? (
                      <div className="flex flex-col items-center gap-1">
                        <NTBBadge applies={expNTB.applies} />
                        {expNTB.details && expNTB.applies && (
                          <span className="text-xs text-slate-500 text-center max-w-[150px]">{expNTB.details}</span>
                        )}
                      </div>
                    ) : <span className="text-slate-600 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {impNTB ? (
                      <div className="flex flex-col items-center gap-1">
                        <NTBBadge applies={impNTB.applies} />
                        {impNTB.details && impNTB.applies && (
                          <span className="text-xs text-slate-500 text-center max-w-[150px]">{impNTB.details}</span>
                        )}
                      </div>
                    ) : <span className="text-slate-600 text-xs">—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Divergencias con recomendaciones */}
      {divergences.length > 0 && (
        <div className="space-y-2 pt-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Divergencias relevantes</p>
          {divergences.map((div, i) => (
            <div key={i} className="bg-yellow-600/10 border border-yellow-500/30 rounded-xl p-4 space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-yellow-400 uppercase">{div.area}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${
                  div.riskLevel === 'high'   ? 'bg-red-600/20 text-red-400 border-red-500/30'    :
                  div.riskLevel === 'medium' ? 'bg-yellow-600/20 text-yellow-400 border-yellow-500/30' :
                  'bg-slate-700 text-slate-400 border-slate-600'
                }`}>{div.riskLevel}</span>
              </div>
              {div.recommendation && (
                <p className="text-slate-300 text-xs leading-relaxed">{div.recommendation}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
