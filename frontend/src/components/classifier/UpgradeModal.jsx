import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PLAN_LABEL = { free: 'Free', pro: 'Pro', team: 'Team', enterprise: 'Enterprise' };

const UPGRADE_COPY = {
  free: {
    cta: 'Adquirir Plan Pro — $49/mes',
    hint: 'Obtén 50 clasificaciones/mes, análisis espejo y scoring de confianza.',
  },
  pro: {
    cta: 'Adquirir Plan Team — $29/seat/mes',
    hint: 'Hasta 2 000 clasificaciones compartidas al mes para tu equipo.',
  },
  team: {
    cta: 'Contactar con Ventas',
    hint: 'Clasificaciones ilimitadas, API dedicada y soporte 24/7.',
  },
};

/**
 * @description Modal que aparece cuando el usuario supera el límite mensual de clasificaciones.
 * Muestra las clasificaciones usadas/límite, fecha de reset y CTA para actualizar el plan.
 * Disparo: el frontend detecta HTTP 429 con error: 'PLAN_LIMIT_EXCEEDED' de planLimiter.
 *
 * @param {{ isOpen: boolean, onClose: Function, errorData: { currentPlan, limit, used, resetDate } | null }} props
 */
export default function UpgradeModal({ isOpen, onClose, errorData }) {
  const navigate = useNavigate();
  const plan = errorData?.currentPlan || 'free';
  const used = errorData?.used ?? 0;
  const limit = errorData?.limit ?? 0;
  const resetDate = errorData?.resetDate;
  const progressPct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 100;

  const copy = UPGRADE_COPY[plan] || UPGRADE_COPY.team;

  const formatReset = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('es', { day: 'numeric', month: 'long' });
  };

  const handleUpgrade = () => {
    onClose();
    // Redirigir a la página de gestión de plan (ruta interna del dashboard)
    navigate('/dashboard/plan');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: 'spring', damping: 20, stiffness: 280 }}
            className="bg-slate-800 border border-blue-500/30 rounded-2xl p-8 w-full max-w-md mx-auto relative"
          >
            {/* Cerrar */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Icono */}
            <div className="w-14 h-14 rounded-2xl bg-blue-600/20 flex items-center justify-center mb-5 mx-auto">
              <Zap className="w-7 h-7 text-blue-400" />
            </div>

            {/* Título */}
            <h2 className="text-xl font-bold text-white text-center mb-2">
              Has alcanzado tu límite mensual
            </h2>
            <p className="text-slate-400 text-sm text-center mb-6">
              Actualiza tu plan para continuar clasificando sin interrupciones.
            </p>

            {/* Métricas de uso */}
            <div className="bg-slate-900/60 rounded-xl p-4 mb-6 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">
                  Plan <span className="font-semibold text-white">{PLAN_LABEL[plan]}</span>
                </span>
                <span className="font-mono font-bold text-white">
                  {used} / {limit === Infinity ? '∞' : limit} clasificaciones
                </span>
              </div>

              {/* Barra de progreso */}
              <div className="bg-slate-700 rounded-full h-2.5 overflow-hidden">
                <motion.div
                  className="h-2.5 rounded-full bg-red-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
              </div>

              <p className="text-xs text-slate-500 text-right">
                {progressPct}% del límite utilizado
                {resetDate && (
                  <span> · Se renueva el <span className="text-slate-400">{formatReset(resetDate)}</span></span>
                )}
              </p>
            </div>

            {/* Hint del plan siguiente */}
            <p className="text-slate-400 text-sm text-center mb-5">{copy.hint}</p>

            {/* Botones */}
            <div className="space-y-3">
              <button
                onClick={handleUpgrade}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-lg py-2.5 font-bold transition shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
              >
                <Zap className="w-4 h-4" />
                {copy.cta}
              </button>
              <button
                onClick={onClose}
                className="w-full border border-white/20 text-slate-300 hover:bg-white/5 rounded-lg py-2.5 text-sm transition"
              >
                Cerrar — esperar al próximo mes
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
