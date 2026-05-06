// Opciones de cada filtro con sus colores activos
const REGIONS = [
  { value: 'all',        label: 'Todas las regiones' },
  { value: 'Africa',     label: 'África' },
  { value: 'Americas',   label: 'Américas' },
  { value: 'Asia',       label: 'Asia' },
  { value: 'Europe',     label: 'Europa' },
  { value: 'MiddleEast', label: 'Medio Oriente' },
  { value: 'Oceania',    label: 'Oceanía' },
];

const LEVELS = [
  { value: 'all',      label: 'Todos',    active: 'bg-slate-600/40 text-white border-slate-500' },
  { value: 'low',      label: 'Bajo',     active: 'bg-green-600/20 text-green-400 border-green-500/50' },
  { value: 'medium',   label: 'Moderado', active: 'bg-yellow-600/20 text-yellow-400 border-yellow-500/50' },
  { value: 'high',     label: 'Alto',     active: 'bg-orange-600/20 text-orange-400 border-orange-500/50' },
  { value: 'critical', label: 'Crítico',  active: 'bg-red-600/20 text-red-400 border-red-500/50' },
];

const TRENDS = [
  { value: 'all',           label: 'Todos',       active: 'bg-slate-600/40 text-white border-slate-500' },
  { value: 'deteriorating', label: '▲ Deteriora', active: 'bg-red-600/20 text-red-400 border-red-500/50' },
  { value: 'stable',        label: '→ Estable',   active: 'bg-slate-700 text-slate-300 border-slate-500' },
  { value: 'improving',     label: '▼ Mejora',    active: 'bg-green-600/20 text-green-400 border-green-500/50' },
];

const BASE_PILL = 'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer';
const INACTIVE  = 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500';

/**
 * @description Filtros compactos del mapa: región (select nativo), nivel (pills), tendencia (pills).
 * Todos los filtros operan en el estado local del hook — sin llamada al backend.
 *
 * @param {Object}   props
 * @param {Object}   props.filters    - Estado actual { region, riskLevel, trend }
 * @param {Function} props.onFilter   - Callback: (filterType, value) => void
 * @param {Function} props.onReset    - Callback para limpiar todos los filtros
 */
export default function RiskMapFilters({ filters, onFilter, onReset }) {
  const hasActiveFilter =
    filters.region !== 'all' || filters.riskLevel !== 'all' || filters.trend !== 'all';

  return (
    <div className="flex items-center gap-2 flex-wrap">

      {/* Selector de región — select nativo estilo oscuro */}
      <select
        value={filters.region}
        onChange={(e) => onFilter('region', e.target.value)}
        className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-slate-500 cursor-pointer"
        style={{ minWidth: 140 }}
      >
        {REGIONS.map((r) => (
          <option key={r.value} value={r.value}>{r.label}</option>
        ))}
      </select>

      {/* Pills de nivel de riesgo */}
      <div className="flex items-center gap-1">
        {LEVELS.map(({ value, label, active }) => (
          <button
            key={value}
            onClick={() => onFilter('riskLevel', value)}
            className={`${BASE_PILL} ${filters.riskLevel === value ? active : INACTIVE}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Pills de tendencia */}
      <div className="flex items-center gap-1">
        {TRENDS.map(({ value, label, active }) => (
          <button
            key={value}
            onClick={() => onFilter('trend', value)}
            className={`${BASE_PILL} ${filters.trend === value ? active : INACTIVE}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Limpiar filtros — visible solo si hay algún filtro activo */}
      {hasActiveFilter && (
        <button
          onClick={onReset}
          className="text-xs text-slate-500 hover:text-white cursor-pointer transition-colors px-1"
        >
          × Limpiar
        </button>
      )}

    </div>
  );
}
