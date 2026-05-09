import { motion } from 'framer-motion';

const FILL_COLOR = {
  low:      'bg-emerald-500',
  medium:   'bg-yellow-500',
  high:     'bg-red-500',
  critical: 'bg-red-600',
};

/**
 * @description Barra de progreso animada que representa el nivel de riesgo aduanero.
 * Transición de color gradual: verde (bajo) → amarillo (medio) → rojo (alto/crítico).
 *
 * @param {{ level: 'low'|'medium'|'high'|'critical', probability: number }} props
 */
export default function RiskProgressBar({ level, probability }) {
  const pct      = Math.min(Math.max(probability || 0, 0), 100);
  const fillCls  = FILL_COLOR[level] || FILL_COLOR.low;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-400">Probabilidad de retención en aduana</span>
        <span className="text-white font-semibold">{pct}%</span>
      </div>
      <div className="bg-slate-700 rounded-full h-2.5 w-full overflow-hidden">
        <motion.div
          className={`h-2.5 rounded-full ${fillCls}`}
          initial={{ width: '0%' }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.5 }}
        />
      </div>
    </div>
  );
}
