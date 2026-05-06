// Colores TRS por rango — misma paleta del mapa SVG
const scoreColor = (val) => {
  const v = parseFloat(val);
  if (v < 3.0) return '#22c55e';
  if (v < 5.0) return '#eab308';
  if (v < 7.0) return '#f97316';
  return '#ef4444';
};

const PILARES = [
  { key: 'trsAduanero',    label: 'Ef. Aduanera',   weight: '30%' },
  { key: 'trsLogistico',   label: 'Fl. Logística',   weight: '30%' },
  { key: 'trsNormativo',   label: 'Seg. Normativa',  weight: '20%' },
  { key: 'trsGeopolitico', label: 'Riesgo Geopolít.', weight: '20%' },
];

/**
 * @description Barras horizontales de CSS puro para los 4 pilares del TRS.
 * Sin recharts — las 4 barras son div con width dinámico, más liviano y sin dependencias.
 * @param {{ data: Object }} props - data es el perfil del país (countryDetail)
 */
export default function TRSBreakdownChart({ data }) {
  return (
    <div className="space-y-3 py-1">
      {PILARES.map(({ key, label, weight }) => {
        const score = parseFloat(data[key]) || 0;
        const pct   = (score / 10) * 100;
        const color = scoreColor(score);

        return (
          <div key={key} className="flex items-center gap-3">
            {/* Label */}
            <div className="w-[118px] shrink-0">
              <span className="text-xs text-slate-400 leading-none">{label}</span>
              <span className="text-[10px] text-slate-600 ml-1">({weight})</span>
            </div>

            {/* Barra */}
            <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${pct}%`, backgroundColor: color }}
              />
            </div>

            {/* Score */}
            <div className="w-7 text-right shrink-0">
              <span className="text-xs font-mono" style={{ color }}>
                {score.toFixed(1)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
