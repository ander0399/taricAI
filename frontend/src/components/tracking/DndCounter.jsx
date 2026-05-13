import { motion } from 'framer-motion';

const STATUS_CONFIG = {
  safe:    { icon: '🛡️', label: 'SEGURO',     barColor: 'bg-emerald-500', textColor: 'text-emerald-400', border: 'border-emerald-500/20' },
  warning: { icon: '⚠️', label: 'ATENCIÓN',   barColor: 'bg-yellow-500',  textColor: 'text-yellow-400',  border: 'border-yellow-500/20'  },
  urgent:  { icon: '🔴', label: 'URGENTE',    barColor: 'bg-red-500',     textColor: 'text-red-400',     border: 'border-red-500/30'     },
  expired: { icon: '💸', label: 'D&D EN CURSO',barColor: 'bg-red-600',    textColor: 'text-red-300',     border: 'border-red-500/50'     },
};

/**
 * @param {{ dnd: object }} props
 * dnd: { freeDaysGranted, status, daysRemaining, daysInDemurrage, estimatedCostUsd, estimatedExpiry }
 */
export default function DndCounter({ dnd }) {
  if (!dnd) return null;

  const { freeDaysGranted, status, daysRemaining, daysInDemurrage, estimatedCostUsd, estimatedExpiry } = dnd;
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.safe;
  const barPct = status === 'expired'
    ? 100
    : Math.max(0, Math.min(100, 100 - (daysRemaining / freeDaysGranted) * 100));

  const expiryLabel = estimatedExpiry
    ? new Date(estimatedExpiry).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

  return (
    <div className={`bg-slate-900/60 border ${cfg.border} rounded-xl p-4 space-y-3`}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
          ⏱ Detention &amp; Demurrage
        </p>
        <span className={`text-xs font-bold ${cfg.textColor}`}>
          {cfg.icon} {cfg.label}
        </span>
      </div>

      {/* Barra de progreso */}
      <div className="bg-slate-700 rounded-full h-2.5 overflow-hidden">
        <motion.div
          className={`h-2.5 rounded-full ${cfg.barColor}`}
          initial={{ width: 0 }}
          animate={{ width: `${barPct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>

      {status !== 'expired' ? (
        <p className={`text-sm font-semibold ${cfg.textColor}`}>
          {daysRemaining} días libres restantes
          <span className="text-slate-500 font-normal text-xs ml-2">
            de {freeDaysGranted} contratados
          </span>
        </p>
      ) : (
        <div className="space-y-1">
          <p className="text-red-400 text-sm font-semibold">
            Días en D&D: {daysInDemurrage}
          </p>
          {estimatedCostUsd != null && (
            <p className="text-red-300 text-xs">
              Costo estimado: <span className="font-bold">${estimatedCostUsd.toLocaleString()} USD</span>
            </p>
          )}
        </div>
      )}

      <p className="text-xs text-slate-500">
        Vencimiento estimado: <span className="text-slate-300">{expiryLabel}</span>
      </p>
    </div>
  );
}
