import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { modalEnter } from '../../styles/animations';

const MONTH_NAMES = [
  'enero','febrero','marzo','abril','mayo','junio',
  'julio','agosto','septiembre','octubre','noviembre','diciembre',
];

const formatDate = (date) => {
  if (!date) return '—';
  const d = new Date(date);
  return `${d.getDate()} de ${MONTH_NAMES[d.getMonth()]}, ${d.getFullYear()}`;
};

/** Features que se pierden al bajar a cada plan */
const DOWNGRADE_WARNINGS = {
  free: [
    'Clasificaciones reducidas a 5 por mes',
    'Sin acceso al clasificador de imágenes ni OCR',
    'Sin exportación de informes PDF',
    'Sin análisis de comercio espejo',
    'El historial de clasificaciones no se borrará',
  ],
  pro: [
    'Clasificaciones reducidas a 50 por mes',
    'Sin gestión de equipos (solo 1 usuario)',
    'Sin análisis de comercio espejo',
  ],
};

/**
 * @description Modal de confirmación antes de ejecutar un downgrade de plan.
 *              Muestra qué features se perderán y la fecha efectiva del cambio.
 *              El usuario debe confirmar explícitamente para evitar downgrades accidentales.
 * @param {{ isOpen, targetPlan, effectiveDate, onConfirm, onCancel, isLoading }} props
 */
const DowngradeConfirmModal = ({ isOpen, targetPlan, effectiveDate, onConfirm, onCancel, isLoading }) => {
  const planLabel = { free: 'Free', pro: 'Pro', team: 'Team' };
  const warnings  = DOWNGRADE_WARNINGS[targetPlan] ?? [];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40"
            onClick={onCancel}
          />

          {/* Card del modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div
              {...modalEnter}
              className="bg-slate-800 border border-blue-500/40 rounded-2xl p-6 shadow-lg shadow-blue-500/10 w-full max-w-md"
            >
              {/* Cabecera */}
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-xl font-bold text-white">
                  ¿Cambiar a Plan {planLabel[targetPlan]}?
                </h2>
                <button
                  onClick={onCancel}
                  className="text-slate-500 hover:text-white transition ml-4 flex-shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Advertencias de pérdida de features */}
              {warnings.length > 0 && (
                <div className="bg-yellow-900/20 border border-yellow-500/20 rounded-xl p-4 mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                    <span className="text-yellow-400 text-sm font-medium">Perderás acceso a:</span>
                  </div>
                  <ul className="space-y-1.5">
                    {warnings.map((w) => (
                      <li key={w} className="text-slate-300 text-sm flex items-start gap-2">
                        <span className="text-yellow-500 mt-0.5">•</span>
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Fecha efectiva */}
              {effectiveDate && (
                <p className="text-slate-400 text-sm mb-5">
                  El cambio se aplicará el{' '}
                  <span className="text-slate-200 font-medium">{formatDate(effectiveDate)}</span>.
                  Conservas el acceso actual hasta esa fecha.
                </p>
              )}

              {/* Acciones */}
              <div className="flex gap-3">
                <button
                  onClick={onCancel}
                  disabled={isLoading}
                  className="flex-1 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 rounded-lg px-5 py-2.5 transition-colors duration-200 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={onConfirm}
                  disabled={isLoading}
                  className="flex-1 bg-red-600/20 border border-red-500/40 hover:bg-red-600/30 text-red-400 rounded-lg px-5 py-2.5 transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    'Confirmar cambio'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default DowngradeConfirmModal;
