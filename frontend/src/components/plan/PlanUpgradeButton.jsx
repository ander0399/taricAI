import { useState } from 'react';
import { upgradePlan, downgradePlan } from '../../services/subscription.api';
import DowngradeConfirmModal from './DowngradeConfirmModal';

const PLAN_ORDER = { free: 0, pro: 1, team: 2, enterprise: 3 };

/**
 * @description Botón inteligente de cambio de plan. Determina automáticamente
 *              si la acción es un upgrade, downgrade o contacto enterprise, y
 *              ejecuta el flujo correcto para cada caso. Los roles admin/member
 *              ven el botón deshabilitado con tooltip explicativo.
 * @param {{
 *   targetPlan:  string,      — plan al que se quiere cambiar
 *   currentPlan: string,      — plan activo actualmente
 *   renewalDate: Date | null, — para mostrar fecha efectiva en downgrade
 *   isOwner:     boolean,     — solo el owner puede ejecutar cambios
 *   onSuccess:   () => void   — callback tras cambio exitoso
 * }} props
 */
const PlanUpgradeButton = ({ targetPlan, currentPlan, renewalDate, isOwner, onSuccess }) => {
  const [loading, setLoading]           = useState(false);
  const [showDowngrade, setShowDowngrade] = useState(false);
  const [error, setError]               = useState(null);

  const currentOrder = PLAN_ORDER[currentPlan] ?? 0;
  const targetOrder  = PLAN_ORDER[targetPlan]  ?? 0;

  const isCurrent   = currentPlan === targetPlan;
  const isUpgrade   = targetOrder > currentOrder;
  const isEnterprise = targetPlan === 'enterprise';

  const handleUpgrade = async () => {
    if (!isOwner || isCurrent) return;
    setLoading(true);
    setError(null);
    try {
      const result = await upgradePlan(targetPlan);
      if (result.type === 'checkout' && result.redirectUrl) {
        window.location.href = result.redirectUrl;
        return;
      }
      onSuccess?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al procesar el cambio. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleDowngradeConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      await downgradePlan(targetPlan);
      setShowDowngrade(false);
      onSuccess?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al procesar el cambio. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Plan actual — sin acción
  if (isCurrent) {
    return (
      <div className="bg-slate-800 border border-slate-700 text-slate-500 rounded-lg px-5 py-2.5 text-sm text-center cursor-default select-none">
        Tu plan actual
      </div>
    );
  }

  // Admin/member — botón deshabilitado con tooltip
  if (!isOwner) {
    return (
      <div className="relative group">
        <button
          disabled
          className="w-full bg-slate-800 border border-slate-700 text-slate-600 rounded-lg px-5 py-2.5 text-sm opacity-50 cursor-not-allowed"
        >
          {isEnterprise ? 'Contactar ventas' : `Cambiar a ${targetPlan === 'free' ? 'Free' : targetPlan === 'pro' ? 'Pro' : 'Team'}`}
        </button>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-700 text-slate-300 text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
          Solo el propietario puede cambiar el plan
        </div>
      </div>
    );
  }

  // Enterprise → contacto de ventas
  if (isEnterprise) {
    return (
      <a
        href="mailto:ventas@taricai.com?subject=Consulta Plan Enterprise"
        className="block w-full text-center border border-white/30 text-white hover:bg-white/10 rounded-lg px-5 py-2.5 text-sm transition-colors duration-200"
      >
        Contactar ventas
      </a>
    );
  }

  // Upgrade — efecto inmediato
  if (isUpgrade) {
    return (
      <>
        {error && <p className="text-xs text-red-400 mb-2">{error}</p>}
        <button
          onClick={handleUpgrade}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-5 py-2.5 font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Procesando...
            </>
          ) : (
            `Cambiar a ${targetPlan === 'pro' ? 'Pro' : 'Team'}`
          )}
        </button>
      </>
    );
  }

  // Downgrade — requiere confirmación
  return (
    <>
      {error && <p className="text-xs text-red-400 mb-2">{error}</p>}
      <button
        onClick={() => setShowDowngrade(true)}
        disabled={loading}
        className="w-full bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 rounded-lg px-5 py-2.5 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {`Cambiar a ${targetPlan === 'free' ? 'Free' : 'Pro'}`}
      </button>

      <DowngradeConfirmModal
        isOpen={showDowngrade}
        targetPlan={targetPlan}
        effectiveDate={renewalDate}
        onConfirm={handleDowngradeConfirm}
        onCancel={() => setShowDowngrade(false)}
        isLoading={loading}
      />
    </>
  );
};

export default PlanUpgradeButton;
