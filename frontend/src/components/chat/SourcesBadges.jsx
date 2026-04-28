import { ExternalLink } from 'lucide-react';

/**
 * @description Renderiza badges de fuentes verificadas usadas en una respuesta.
 * Solo muestra fuentes con status 'ok'. Si no hay fuentes, no renderiza nada.
 */
export default function SourcesBadges({ sources = [] }) {
  const okSources = sources.filter(s => s.status === 'ok');
  if (!okSources.length) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {okSources.map((s, i) => (
        <a
          key={i}
          href={s.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 bg-slate-700/60 border border-slate-600 text-slate-400 text-xs rounded-md px-2 py-1 hover:bg-slate-700 hover:text-slate-300 transition-colors cursor-pointer"
        >
          <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />
          {s.name}
        </a>
      ))}
    </div>
  );
}
