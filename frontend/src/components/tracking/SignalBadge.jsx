import { motion } from 'framer-motion';

const SIGNAL_CONFIG = {
  live:      { dot: '●', color: '#00C896', label: 'EN VIVO',       pulse: true  },
  recent:    { dot: '●', color: '#4A9EFF', label: 'RECIENTE',      pulse: false },
  delayed:   { dot: '●', color: '#F6C344', label: 'DEMORADO',      pulse: false },
  estimated: { dot: '●', color: '#A0B4C8', label: 'ESTIMADO',      pulse: false },
  lost:      { dot: '○', color: '#4A5568', label: 'SIN SEÑAL',     pulse: false },
  fallback:  { dot: '◈', color: '#F6C344', label: 'MODO RESPALDO', pulse: false },
  demo:      { dot: '●', color: '#00C896', label: 'DEMO',          pulse: true  },
  connecting:{ dot: '●', color: '#4A5568', label: 'CONECTANDO...',  pulse: true  },
};

export default function SignalBadge({ state = 'connecting', size = 'md' }) {
  const cfg = SIGNAL_CONFIG[state] || SIGNAL_CONFIG.connecting;
  const textSize = size === 'sm' ? 'text-[10px]' : 'text-xs';
  const dotSize  = size === 'sm' ? 'text-[8px]'  : 'text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold tracking-widest ${textSize}`}
      style={{ color: cfg.color }}
      aria-live="polite"
      aria-label={`Estado AIS: ${cfg.label}`}
    >
      {cfg.pulse ? (
        <motion.span
          className={dotSize}
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
        >
          {cfg.dot}
        </motion.span>
      ) : (
        <span className={dotSize}>{cfg.dot}</span>
      )}
      {cfg.label}
    </span>
  );
}
