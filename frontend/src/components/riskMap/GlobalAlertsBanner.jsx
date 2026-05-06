import { Siren } from 'lucide-react';

/**
 * @description Banner de alertas activas — países con riskLevel=critical o trend=deteriorating.
 * Solo se renderiza si alerts.length > 0. Muestra max 5 pills + contador de restantes.
 * Click en un pill llama onSelectCountry para centrar el mapa en ese país.
 *
 * @param {Object}   props
 * @param {Array}    props.alerts          - Países en alerta (del hook useRiskMap)
 * @param {Function} props.onSelectCountry - Callback al hacer click en un país del banner
 */
export default function GlobalAlertsBanner({ alerts, onSelectCountry }) {
  if (!alerts?.length) return null;

  const visible = alerts.slice(0, 5);
  const extra   = alerts.length - 5;

  return (
    <div className="flex items-center gap-3 flex-wrap px-6 py-3 bg-red-900/20 border-b border-red-500/20">
      <Siren className="w-4 h-4 text-red-400 animate-pulse shrink-0" />
      <span className="text-sm text-red-300 font-medium shrink-0">Alertas activas:</span>

      {visible.map((c) => (
        <button
          key={c.isoAlpha3}
          onClick={() => onSelectCountry(c.isoAlpha3)}
          className="bg-red-900/40 text-red-300 border border-red-500/30 px-2 py-0.5 rounded text-xs font-mono cursor-pointer hover:bg-red-800/50 transition-colors"
        >
          {c.isoAlpha3}
        </button>
      ))}

      {extra > 0 && (
        <span className="text-xs text-slate-500">y {extra} más</span>
      )}
    </div>
  );
}
