import { Globe2 } from 'lucide-react';
import useRiskMap from '../../hooks/useRiskMap';
import WorldMapSVG from './WorldMapSVG';
import RiskMapLegend from './RiskMapLegend';
import RiskMapFilters from './RiskMapFilters';
import GlobalAlertsBanner from './GlobalAlertsBanner';
import CountryRiskPanel from './CountryRiskPanel';

// Tiempo relativo desde una fecha ISO hasta ahora
const relativeTime = (isoStr) => {
  if (!isoStr) return null;
  const diffMs = Date.now() - new Date(isoStr).getTime();
  const h = Math.floor(diffMs / 3600000);
  if (h < 1) return 'hace menos de 1h';
  if (h < 24) return `hace ${h}h`;
  const d = Math.floor(h / 24);
  return `hace ${d}d`;
};

/**
 * @description Contenedor principal del módulo Mapa de Riesgo País · TARIC 360°.
 * Posición fija en Dashboard: inmediatamente después de las Quick Access Cards.
 * Ocupa el 100% del ancho del contenedor max-w-6xl sin márgenes adicionales.
 *
 * Layout interno:
 *   Header (título + badge timestamp + filtros)
 *   GlobalAlertsBanner (condicional)
 *   Grid desktop: [mapa + leyenda | panel de detalle]
 */
export default function RiskMapSection() {
  const {
    countries,
    filteredCountries,
    selectedIso,
    countryDetail,
    alerts,
    lastUpdate,
    nextUpdate,
    loading,
    error,
    filters,
    userPlan,
    selectCountry,
    clearSelection,
    applyFilter,
    resetFilters,
    trackInteraction,
  } = useRiskMap();

  const handleSelectCountry = (iso) => {
    selectCountry(iso);
    trackInteraction(iso, 'click');
  };

  const timeAgo = relativeTime(lastUpdate);

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-700 flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <Globe2 className="w-5 h-5 text-blue-400 shrink-0" />
          <h2 className="text-lg font-semibold text-white">Riesgo País · TARIC 360°</h2>
          {timeAgo && (
            <span className="text-xs text-slate-400 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-full">
              Actualizado: {timeAgo}
            </span>
          )}
          {loading.countries && (
            <span className="text-xs text-slate-500 animate-pulse">Cargando...</span>
          )}
        </div>

        <RiskMapFilters
          filters={filters}
          onFilter={applyFilter}
          onReset={resetFilters}
        />
      </div>

      {/* ── Banner de alertas (solo si hay países críticos / deteriorando) ── */}
      <GlobalAlertsBanner alerts={alerts} onSelectCountry={handleSelectCountry} />

      {/* ── Error de carga del mapa ─────────────────────────────────────────── */}
      {error.countries && (
        <div className="px-6 py-3 bg-red-900/10 border-b border-red-500/20">
          <p className="text-xs text-red-400">{error.countries}</p>
        </div>
      )}

      {/* ── Layout principal: mapa (izq) + panel (der) ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] min-h-[420px]">

        {/* Columna izquierda — mapa SVG + leyenda */}
        <div className="flex flex-col border-b lg:border-b-0 lg:border-r border-slate-700">
          <div className="flex-1 min-h-[380px]">
            <WorldMapSVG
              countries={countries}
              filteredCountries={filteredCountries}
              selectedIso={selectedIso}
              onSelectCountry={handleSelectCountry}
            />
          </div>
          <RiskMapLegend lastUpdate={lastUpdate} nextUpdate={nextUpdate} />
        </div>

        {/* Columna derecha — panel de detalle del país */}
        <div className="relative">
          {/* Botón cerrar selección en mobile */}
          {selectedIso && (
            <button
              onClick={clearSelection}
              className="absolute top-3 right-3 z-10 text-slate-500 hover:text-white text-xs transition-colors lg:hidden"
            >
              ✕ Cerrar
            </button>
          )}
          <CountryRiskPanel
            data={countryDetail}
            loading={loading.countryDetail}
            error={error.countryDetail}
            userPlan={userPlan}
            selectedIso={selectedIso}
            onRetry={() => selectedIso && selectCountry(selectedIso)}
          />
        </div>

      </div>
    </div>
  );
}
