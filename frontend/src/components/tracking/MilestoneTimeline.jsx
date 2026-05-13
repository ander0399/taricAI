import { motion } from 'framer-motion';
import { CheckCircle2, Circle, AlertTriangle, Loader2 } from 'lucide-react';
import { useState } from 'react';

function formatDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function EventRow({ event, isActive, isCurrent, onToggle }) {
  const isRollover = event.code === 'EVT-12';
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-start gap-3 py-2.5 px-3 rounded-lg transition-colors ${
        isRollover && event.isCompleted ? 'bg-red-900/20 border border-red-500/20' : ''
      }`}
    >
      {/* Ícono de estado */}
      <div className="mt-0.5 flex-shrink-0">
        {event.isCompleted ? (
          <CheckCircle2 className={`w-4 h-4 ${isRollover ? 'text-red-400' : 'text-emerald-400'}`} />
        ) : isCurrent ? (
          <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
        ) : (
          <Circle className="w-4 h-4 text-slate-600" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={`text-sm font-medium leading-snug ${
            event.isCompleted ? 'text-slate-300' : isCurrent ? 'text-blue-300' : 'text-slate-500'
          }`}>
            <span className="text-slate-600 text-xs mr-1.5">{event.code}</span>
            {isRollover && event.isCompleted && <AlertTriangle className="w-3.5 h-3.5 text-red-400 inline mr-1" />}
            {event.name}
          </p>
        </div>

        {/* Timestamp */}
        {event.isCompleted && event.occurredAt && (
          <p className="text-xs text-slate-500 mt-0.5">
            ✓ {formatDate(event.occurredAt)}
            {event.locationName && <span className="ml-1 text-slate-600">· {event.locationName}</span>}
          </p>
        )}
        {!event.isCompleted && event.estimatedAt && (
          <p className="text-xs text-slate-600 mt-0.5">
            Est. {formatDate(event.estimatedAt)}
          </p>
        )}

        {/* Evento actual — badge */}
        {isCurrent && (
          <span className="inline-block mt-1 text-[10px] font-bold text-blue-300 bg-blue-600/20 px-1.5 py-0.5 rounded uppercase tracking-wider">
            En curso
          </span>
        )}
      </div>
    </motion.div>
  );
}

export default function MilestoneTimeline({ events = [], onMarkEvent }) {
  const [showAll, setShowAll] = useState(false);

  if (!events.length) {
    return <p className="text-slate-500 text-sm">No hay eventos registrados.</p>;
  }

  // Determinar el evento "actual" (primer no completado)
  const currentIdx = events.findIndex(e => !e.isCompleted);

  const visibleEvents = showAll ? events : events.slice(0, 10);

  return (
    <div className="space-y-0.5">
      {visibleEvents.map((event, idx) => (
        <EventRow
          key={event.code}
          event={event}
          isActive={event.isCompleted}
          isCurrent={currentIdx === events.indexOf(event)}
          onToggle={onMarkEvent ? () => onMarkEvent(event.code, !event.isCompleted) : null}
        />
      ))}

      {events.length > 10 && (
        <button
          onClick={() => setShowAll(v => !v)}
          className="w-full text-xs text-slate-500 hover:text-slate-300 py-2 transition"
        >
          {showAll
            ? '▴ Colapsar'
            : `▾ Ver ${events.length - 10} eventos más`}
        </button>
      )}
    </div>
  );
}
