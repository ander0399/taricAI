import { motion } from 'framer-motion';
import { Check, Zap, Users, Building2, Shield } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import PlanUpgradeButton from './PlanUpgradeButton';
import { cardEnter } from '../../styles/animations';

const PLANS = [
  {
    id:    'free',
    label: 'Free',
    price: '$0',
    billing: 'sin costo',
    icon:  Shield,
    description: 'Para empezar a explorar Taric AI.',
    features: [
      '1 usuario',
      '5 clasificaciones / mes',
      'Clasificador de texto',
      'Soporte por email',
    ],
  },
  {
    id:    'pro',
    label: 'Pro',
    price: '$49',
    billing: 'USD / mes',
    icon:  Zap,
    description: 'Para profesionales de comercio exterior.',
    features: [
      '1 usuario',
      '50 clasificaciones / mes',
      'Clasificador texto + imagen + OCR',
      'Exportación PDF',
      'Historial completo',
      'Soporte prioritario',
    ],
  },
  {
    id:    'team',
    label: 'Team',
    price: '$29',
    billing: 'USD / seat / mes',
    icon:  Users,
    description: 'Para equipos de hasta 15 personas.',
    popular: true,
    features: [
      'Hasta 15 usuarios',
      '2.000 clasificaciones / mes (compartidas)',
      'Todo lo de Pro',
      'Gestión de equipos',
      'Análisis de comercio espejo',
      'Dashboard compartido',
    ],
  },
  {
    id:    'enterprise',
    label: 'Enterprise',
    price: 'Custom',
    billing: 'precio negociado',
    icon:  Building2,
    description: 'Para grandes operaciones aduaneras.',
    features: [
      'Usuarios ilimitados',
      'Clasificaciones ilimitadas',
      'Todo lo de Team',
      'Acceso API',
      'Integraciones personalizadas',
      'SLA dedicado',
    ],
  },
];

/** Estilos de borde/ring para la card del plan activo */
const CURRENT_RING = {
  free:       'ring-2 ring-slate-500/60',
  pro:        'ring-2 ring-blue-500/60',
  team:       'ring-2 ring-emerald-500/60',
  enterprise: 'ring-2 ring-purple-500/60',
};

const BADGE_PLAN = {
  free:       'bg-slate-700 text-slate-300 border border-slate-600',
  pro:        'bg-blue-600/20 text-blue-300 border border-blue-500/30',
  team:       'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30',
  enterprise: 'bg-purple-600/20 text-purple-300 border border-purple-500/30',
};

/**
 * @description Grid de 4 tarjetas de plan. Replica el diseño de la Landing Page
 *              para que el usuario reconozca los planes. El plan activo tiene
 *              ring-2 de color. Solo el owner puede interactuar con los botones.
 * @param {{ currentPlan: string, renewalDate: Date | null, onPlanChange: () => void }} props
 */
const PlanSelector = ({ currentPlan, renewalDate, onPlanChange }) => {
  const { isOwner } = useAuth();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {PLANS.map((plan, i) => {
        const Icon      = plan.icon;
        const isCurrent = currentPlan === plan.id;

        return (
          <motion.div
            key={plan.id}
            {...cardEnter(i * 0.05)}
            className={`bg-slate-800 border rounded-2xl p-6 flex flex-col relative
              ${plan.popular ? 'border-2 border-emerald-500' : 'border-slate-700'}
              ${isCurrent ? CURRENT_RING[plan.id] : ''}
            `}
          >
            {/* Badge MÁS POPULAR */}
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide whitespace-nowrap">
                  Más popular
                </span>
              </div>
            )}

            {/* Badge plan actual */}
            {isCurrent && (
              <div className="mb-3">
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${BADGE_PLAN[plan.id]}`}>
                  Tu plan actual
                </span>
              </div>
            )}

            {/* Icono + nombre */}
            <div className="flex items-center gap-2 mb-2">
              <Icon className="w-5 h-5 text-blue-400" />
              <span className="text-white font-semibold">{plan.label}</span>
            </div>

            {/* Precio */}
            <div className="mb-1">
              <span className="text-2xl font-bold text-white">{plan.price}</span>
              {plan.price !== 'Custom' && (
                <span className="text-slate-400 text-sm ml-1">{plan.billing}</span>
              )}
            </div>
            <p className="text-slate-400 text-sm mb-4 leading-relaxed">{plan.description}</p>

            {/* Features */}
            <ul className="space-y-2 mb-6 flex-1">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-slate-300 text-sm">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>

            {/* Botón de acción */}
            <PlanUpgradeButton
              targetPlan={plan.id}
              currentPlan={currentPlan}
              renewalDate={renewalDate}
              isOwner={isOwner}
              onSuccess={onPlanChange}
            />
          </motion.div>
        );
      })}
    </div>
  );
};

export default PlanSelector;
