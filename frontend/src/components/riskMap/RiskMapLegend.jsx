// Leyenda alineada con la paleta TRS del mapa SVG y del backend
const LEGEND_ITEMS = [
  { color: '#22c55e', label: 'Bajo (1–2.9)' },
  { color: '#eab308', label: 'Moderado (3–4.9)' },
  { color: '#f97316', label: 'Alto (5–6.9)' },
  { color: '#ef4444', label: 'Crítico (7–10)' },
  { color: '#334155', label: 'Sin datos' },
];

/**
 * @description Leyenda del mapa: paleta de colores TRS + timestamps de actualización.
 * Posición: bajo el mapa, separada por un borde superior.
 *
 * @param {Object}      props
 * @param {string|null} props.lastUpdate  - ISO timestamp de la última actualización global
 * @param {string|null} props.nextUpdate  - ISO timestamp estimado de la próxima (opcional)
 */
export default function RiskMapLegend({ lastUpdate, nextUpdate }) {
  const fmt = (ts) => {
    if (!ts) return '—';
    return new Date(ts).toLocaleString('es-CO', {
      dateStyle: 'short',
      timeStyle: 'short',
      timeZone: 'UTC',
    }) + ' UTC';
  };

  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-slate-700 flex-wrap gap-3">

      {/* Ítems de color */}
      <div className="flex items-center gap-4 flex-wrap">
        {LEGEND_ITEMS.map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-sm shrink-0"
              style={{ backgroundColor: color }}
            />
            <span className="text-xs text-slate-400">{label}</span>
          </div>
        ))}
      </div>

      {/* Timestamps */}
      <div className="text-right">
        <p className="text-xs text-slate-500">
          Actualizado: <span className="text-slate-400">{fmt(lastUpdate)}</span>
        </p>
        {nextUpdate && (
          <p className="text-xs text-slate-600">
            Próximo: {fmt(nextUpdate)}
          </p>
        )}
      </div>

    </div>
  );
}
