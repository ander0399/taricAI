import { TrendingDown, TrendingUp, Minus } from 'lucide-react';

/**
 * @description Badge animado de tendencia del TRS.
 * 'deteriorating' pulsa para indicar urgencia operativa.
 * @param {{ trend: 'improving'|'stable'|'deteriorating', className?: string }} props
 */
export default function RiskTrendBadge({ trend, className = '' }) {
  const config = {
    improving: {
      Icon:  TrendingDown,
      text:  'Mejorando',
      style: 'bg-green-600/20 text-green-400 border-green-500/30',
    },
    stable: {
      Icon:  Minus,
      text:  'Estable',
      style: 'bg-slate-700 text-slate-300 border-slate-600',
    },
    deteriorating: {
      Icon:  TrendingUp,
      text:  'Deteriorando',
      style: 'bg-red-600/20 text-red-400 border-red-500/30 animate-pulse',
    },
  };

  const { Icon, text, style } = config[trend] ?? config.stable;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${style} ${className}`}>
      <Icon className="w-3.5 h-3.5" />
      {text}
    </span>
  );
}
