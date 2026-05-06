/**
 * @description Badge visual del nivel de riesgo TRS.
 * Colores CESCE alineados con la paleta del mapa SVG.
 * @param {{ level: 'low'|'medium'|'high'|'critical', className?: string }} props
 */
export default function RiskLevelBadge({ level, className = '' }) {
  const styles = {
    low:      'bg-green-600/20  text-green-400  border-green-500/30',
    medium:   'bg-yellow-600/20 text-yellow-400 border-yellow-500/30',
    high:     'bg-orange-600/20 text-orange-400 border-orange-500/30',
    critical: 'bg-red-600/20    text-red-400    border-red-500/30 animate-pulse',
  };

  const labels = {
    low: 'Riesgo Bajo', medium: 'Riesgo Moderado',
    high: 'Riesgo Alto', critical: 'Riesgo Crítico',
  };

  const style = styles[level] ?? styles.high;
  const label = labels[level] ?? level;

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${style} ${className}`}>
      {label}
    </span>
  );
}
