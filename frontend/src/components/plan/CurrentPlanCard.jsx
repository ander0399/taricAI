import { AlertTriangle, ExternalLink } from 'lucide-react';
import { getPortalSession } from '../../services/subscription.api';

const PLAN_LABEL = {
  free:       'Free',
  pro:        'Pro',
  team:       'Team',
  enterprise: 'Enterprise',
};

const PLAN_BADGE = {
  free:       'bg-slate-700 text-slate-300 border border-slate-600',
  pro:        'bg-blue-600/20 text-blue-300 border border-blue-500/30',
  team:       'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30',
  enterprise: 'bg-purple-600/20 text-purple-300 border border-purple-500/30',
};

const PLAN_PRICE = {
  free:       null,
  pro:        '$49 USD/mes',
  team:       '$29 USD/seat/mes',
  enterprise: 'Precio negociado',
};

/** Borde de card según plan */
const PLAN_CARD_BORDER = {
  free:       'border-slate-700',
  pro:        'border-blue-500/40 shadow-blue-500/10',
  team:       'border-emerald-500/40 shadow-emerald-500/10',
  enterprise: 'border-purple-500/40 shadow-purple-500/10',
};

/** Color de la barra de uso según porcentaje */
const barColor = (pct) => {
  if (pct >= 90) return 'bg-red-500';
  if (pct >= 70) return 'bg-yellow-500';
  return 'bg-blue-500';
};

const MONTH_NAMES = [
  'enero','febrero','marzo','abril','mayo','junio',
  'julio','agosto','septiembre','octubre','noviembre','diciembre',
];

const formatDate = (date) => {
  if (!date) return null;
  const d = new Date(date);
  return `${d.getDate()} de ${MONTH_NAMES[d.getMonth()]}, ${d.getFullYear()}`;
};

/**
 * @description Muestra el plan activo de la empresa con barra de uso dinámica,
 *              fecha de renovación, estado de Stripe y banner de pago fallido.
 *              El color de la barra cambia según el consumo:
 *              < 70% azul | 70–89% amarillo | ≥ 90% rojo.
 * @param {{ plan, usage, renewalDate, stripeStatus, cancelAtPeriodEnd, isLoading }} props
 */
const CurrentPlanCard = ({ plan, usage, renewalDate, stripeStatus, cancelAtPeriodEnd, isLoading }) => {

  const handlePortal = async () => {
    try {
      const { url } = await getPortalSession();
      window.open(url, '_blank', 'noopener');
    } catch {
      // El portal de Stripe solo está disponible para planes de pago
    }
  };

  if (isLoading) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-4">
        <div className="h-5 bg-slate-700/50 rounded-lg animate-pulse w-24" />
        <div className="h-8 bg-slate-700/50 rounded-lg animate-pulse w-40" />
        <div className="h-2.5 bg-slate-700/50 rounded-full animate-pulse" />
      </div>
    );
  }

  const { used, limit, percentage } = usage ?? { used: 0, limit: 5, percentage: 0 };
  const isInfinite = limit === Infinity;

  return (
    <div className={`bg-slate-800 border rounded-2xl p-6 shadow-lg ${PLAN_CARD_BORDER[plan] ?? PLAN_CARD_BORDER.free}`}>

      {/* Banner de pago fallido */}
      {stripeStatus === 'past_due' && (
        <div className="mb-5 bg-red-900/30 border border-red-500/40 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-red-300 text-sm leading-relaxed">
              Tu último pago falló. Actualiza tu método de pago para evitar la suspensión del servicio.
            </p>
            <button
              onClick={handlePortal}
              className="mt-2 text-xs text-red-400 hover:text-red-300 underline transition-colors"
            >
              Actualizar tarjeta →
            </button>
          </div>
        </div>
      )}

      {/* Cabecera: badge + precio */}
      <div className="flex items-center justify-between mb-4">
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${PLAN_BADGE[plan]}`}>
          {PLAN_LABEL[plan]}
        </span>
        {PLAN_PRICE[plan] && (
          <span className="text-slate-300 text-sm font-medium">{PLAN_PRICE[plan]}</span>
        )}
      </div>

      {/* Nombre del plan */}
      <h3 className="text-xl font-semibold text-white mb-4">
        Plan {PLAN_LABEL[plan]}
        {cancelAtPeriodEnd && (
          <span className="ml-3 text-xs bg-yellow-600/20 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-full">
            Cancela el {formatDate(renewalDate)}
          </span>
        )}
      </h3>

      {/* Barra de uso mensual */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-sm text-slate-400">Clasificaciones este mes</span>
          <span className="text-sm text-slate-300 font-medium">
            {isInfinite ? `${used} ilimitadas` : `${used} de ${limit}`}
          </span>
        </div>
        {!isInfinite && (
          <>
            <div className="bg-slate-700 rounded-full h-2.5 w-full">
              <div
                className={`rounded-full h-2.5 transition-all duration-500 ${barColor(percentage)}`}
                style={{ width: `${percentage}%` }}
              />
            </div>
            {percentage >= 90 && (
              <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Estás cerca del límite de tu plan.
              </p>
            )}
          </>
        )}
      </div>

      {/* Renovación y estado */}
      {plan === 'free' ? (
        <p className="text-sm text-slate-500">Plan gratuito — sin fecha de renovación</p>
      ) : (
        <div className="flex items-center justify-between text-sm">
          {renewalDate && (
            <span className="text-slate-400">
              Próxima renovación:{' '}
              <span className="text-slate-300">{formatDate(renewalDate)}</span>
            </span>
          )}
          <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium">
            <span className="w-2 h-2 bg-emerald-400 rounded-full" />
            {stripeStatus === 'active' ? 'Activa' : stripeStatus ?? 'Activa'}
          </span>
        </div>
      )}

      {/* Link al portal de Stripe */}
      {plan !== 'free' && plan !== 'enterprise' && (
        <button
          onClick={handlePortal}
          className="mt-5 flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors duration-200"
        >
          Ver historial de facturas en Stripe
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

export default CurrentPlanCard;
