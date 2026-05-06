import { useState, useEffect } from 'react';
import {
  MapPin, AlertTriangle, Newspaper, Lightbulb,
  ExternalLink, Clock, AlertCircle, FileDown,
} from 'lucide-react';
import RiskLevelBadge from './RiskLevelBadge';
import RiskTrendBadge from './RiskTrendBadge';
import TRSBreakdownChart from './TRSBreakdownChart';
import PlanGateOverlay from './PlanGateOverlay';
import { fetchCountryHistory, downloadRiskPDF } from '../../services/riskMap.api';

// ── Colores del score TRS ──────────────────────────────────────────────────────
const scoreColor = (val) => {
  const v = parseFloat(val);
  if (v < 3.0) return '#22c55e';
  if (v < 5.0) return '#eab308';
  if (v < 7.0) return '#f97316';
  return '#ef4444';
};

// ── Sparkline SVG puro (sin recharts) ─────────────────────────────────────────
function Sparkline({ history, riskLevel }) {
  if (!history?.length) return null;

  const values = history.map((h) => parseFloat(h.trsSnapshot?.trsOverall ?? 5));
  const min = Math.min(...values);
  const max = Math.max(...values, min + 0.01); // evitar división por cero
  const W = 280, H = 56;
  const pad = 4;

  const points = values.map((v, i) => {
    const x = pad + (i / (values.length - 1 || 1)) * (W - pad * 2);
    const y = H - pad - ((v - min) / (max - min)) * (H - pad * 2);
    return `${x},${y}`;
  }).join(' ');

  const color = scoreColor(values[values.length - 1]);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity={0.85}
      />
      {/* Punto destacado en el último valor */}
      {values.length > 0 && (() => {
        const lastX = pad + ((values.length - 1) / (values.length - 1 || 1)) * (W - pad * 2);
        const lastY = H - pad - ((values[values.length - 1] - min) / (max - min)) * (H - pad * 2);
        return <circle cx={lastX} cy={lastY} r={3} fill={color} />;
      })()}
    </svg>
  );
}

// ── Estados del panel ─────────────────────────────────────────────────────────

function PanelEmpty() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-12">
      <MapPin className="w-10 h-10 text-slate-700 mb-3" />
      <p className="text-sm text-slate-500 text-center max-w-[160px] leading-relaxed">
        Selecciona un país en el mapa para ver su análisis de riesgo
      </p>
    </div>
  );
}

function PanelSkeleton() {
  return (
    <div className="p-5 space-y-4 animate-pulse">
      <div className="h-6 w-3/4 bg-slate-700 rounded" />
      <div className="h-16 w-full bg-slate-700 rounded" />
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => <div key={i} className="h-4 w-full bg-slate-700 rounded" />)}
      </div>
      <div className="h-16 w-full bg-slate-700 rounded" />
    </div>
  );
}

function PanelError({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-12">
      <AlertCircle className="w-8 h-8 text-red-400 mb-2" />
      <p className="text-sm text-red-400 mb-3 text-center">{message || 'No se pudo cargar el análisis.'}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs text-slate-400 hover:text-white border border-slate-600 hover:border-slate-400 rounded-lg px-3 py-1.5 transition-colors"
        >
          Reintentar
        </button>
      )}
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

/**
 * @description Panel lateral de detalle del país seleccionado.
 * Muestra análisis TRS completo con gate de plan para features Pro+.
 * Diferencia de contenido según plan: Free (básico) vs Pro+ (completo + historial + PDF).
 *
 * @param {Object}      props
 * @param {Object|null} props.data          - countryDetail del hook useRiskMap
 * @param {boolean}     props.loading       - Estado de carga del detalle
 * @param {string|null} props.error         - Mensaje de error
 * @param {string}      props.userPlan      - Plan activo del usuario
 * @param {string|null} props.selectedIso   - ISO alpha-3 del país seleccionado
 * @param {Function}    props.onRetry       - Callback para reintentar la carga
 */
export default function CountryRiskPanel({ data, loading, error, userPlan, selectedIso, onRetry }) {
  const isPro = ['pro', 'team', 'enterprise'].includes(userPlan);
  const [history,      setHistory]      = useState([]);
  const [loadingHist,  setLoadingHist]  = useState(false);
  const [exporting,    setExporting]    = useState(false);

  // Cargar historial cuando el país cambia y el usuario tiene plan Pro+
  useEffect(() => {
    if (!selectedIso || !isPro || !data) return;
    setLoadingHist(true);
    fetchCountryHistory(selectedIso, 30)
      .then((r) => setHistory(r.data || []))
      .catch(() => setHistory([]))
      .finally(() => setLoadingHist(false));
  }, [selectedIso, isPro, data]);

  const handleExportPDF = async () => {
    if (!selectedIso || exporting) return;
    setExporting(true);
    try {
      await downloadRiskPDF(selectedIso);
    } finally {
      setExporting(false);
    }
  };

  // ── Estados vacío / cargando / error ────────────────────────────────────────
  if (!selectedIso && !loading) return <PanelEmpty />;
  if (loading)                  return <PanelSkeleton />;
  if (error && !data)           return <PanelError message={error} onRetry={onRetry} />;
  if (!data)                    return <PanelEmpty />;

  const trsNum   = parseFloat(data.trsOverall);
  const trsColor = scoreColor(trsNum);
  const isStale  = data.lastUpdatedAt && (Date.now() - new Date(data.lastUpdatedAt).getTime()) > 48 * 3600 * 1000;
  const isPending = !data.criticalInsight;

  return (
    <div className="p-5 space-y-4 overflow-y-auto h-full">

      {/* ── Header del país ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <img
          src={`https://flagcdn.com/24x18/${data.isoAlpha2?.toLowerCase()}.png`}
          alt={data.countryNameEs}
          className="w-8 h-6 rounded-sm object-cover shrink-0"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
        <div>
          <span className="text-lg font-semibold text-white leading-tight">{data.countryNameEs}</span>
          <span className="text-xs font-mono text-slate-500 ml-1.5">{data.isoAlpha3}</span>
        </div>
      </div>

      {/* ── Score TRS ──────────────────────────────────────────────────────── */}
      <div className="text-center py-2">
        <div className="text-5xl font-bold font-mono leading-none" style={{ color: trsColor }}>
          {trsNum.toFixed(1)}
        </div>
        <div className="text-xs uppercase tracking-widest text-slate-500 mt-1">TARIC RISK SCORE</div>
        <div className="flex items-center justify-center gap-2 mt-2">
          <RiskTrendBadge trend={data.trend} />
          <RiskLevelBadge level={data.riskLevel} />
        </div>
      </div>

      {/* ── 4 Pilares ──────────────────────────────────────────────────────── */}
      <TRSBreakdownChart data={data} />

      {/* ── Análisis hoy ───────────────────────────────────────────────────── */}
      {isPending ? (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
          <p className="text-xs text-slate-500 italic">En proceso de análisis...</p>
        </div>
      ) : (
        <>
          {data.criticalInsight && (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
              <div className="flex items-center gap-1.5 mb-1">
                <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0" />
                <span className="text-xs font-semibold text-yellow-400 uppercase tracking-wide">Análisis Hoy</span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">{data.criticalInsight}</p>
            </div>
          )}

          {data.localSourceAlert && (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
              <div className="flex items-center gap-1.5 mb-1">
                <Newspaper className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="text-xs font-semibold text-blue-400 uppercase tracking-wide">Alerta Local</span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">{data.localSourceAlert}</p>
            </div>
          )}
        </>
      )}

      {/* ── Recomendación Pro (gate de plan) ───────────────────────────────── */}
      {isPro ? (
        data.proRecommendation && (
          <div className="bg-emerald-600/10 border border-emerald-500/30 rounded-xl p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <Lightbulb className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">Recomendación Pro</span>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">{data.proRecommendation}</p>
          </div>
        )
      ) : (
        <PlanGateOverlay featureName="Recomendación táctica" requiredPlan="pro" />
      )}

      {/* ── Historial sparkline (gate de plan) ─────────────────────────────── */}
      {isPro ? (
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
            Historial TRS — 30 días
          </p>
          {loadingHist ? (
            <div className="h-14 bg-slate-700 rounded animate-pulse" />
          ) : history.length > 1 ? (
            <Sparkline history={history} riskLevel={data.riskLevel} />
          ) : (
            <p className="text-xs text-slate-600 italic">Sin historial disponible aún.</p>
          )}
        </div>
      ) : (
        <PlanGateOverlay featureName="Historial TRS (30 días)" requiredPlan="pro" />
      )}

      {/* ── Fuentes ────────────────────────────────────────────────────────── */}
      {data.sources?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Fuentes</p>
          <ul className="space-y-0.5">
            {data.sources.map((src, i) => (
              <li key={i} className="flex items-center gap-1.5 text-xs text-slate-500">
                <ExternalLink className="w-3 h-3 shrink-0" />
                <span>{src}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Metadata de actualización ───────────────────────────────────────── */}
      <div className="flex items-center gap-1 pt-1">
        <Clock className="w-3 h-3 text-slate-600 shrink-0" />
        <span className="text-xs text-slate-600">
          Datos al {data.lastUpdatedAt
            ? new Date(data.lastUpdatedAt).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })
            : '—'}
        </span>
        {isStale && (
          <span className="ml-2 text-xs text-yellow-500 font-medium">⚠ Datos desactualizados</span>
        )}
      </div>

      {/* ── Exportar PDF (gate de plan) ─────────────────────────────────────── */}
      <button
        onClick={isPro ? handleExportPDF : undefined}
        disabled={!isPro || exporting}
        className={`w-full flex items-center justify-center gap-2 border rounded-lg px-4 py-2 text-sm font-medium transition-colors
          ${isPro
            ? 'border-white/30 text-white hover:bg-white/10 cursor-pointer'
            : 'border-slate-700 text-slate-600 cursor-not-allowed opacity-50'
          }`}
        title={!isPro ? 'Disponible en Plan Pro' : undefined}
      >
        <FileDown className="w-4 h-4" />
        {exporting ? 'Generando...' : 'Exportar análisis a PDF'}
      </button>

    </div>
  );
}
