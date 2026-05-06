import { Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * @description Overlay bloqueador para features exclusivas de Plan Pro+.
 * Se renderiza en lugar del contenido cuando el plan del usuario es insuficiente.
 * @param {{ featureName: string, requiredPlan?: 'pro'|'team'|'enterprise' }} props
 */
export default function PlanGateOverlay({ featureName, requiredPlan = 'Pro' }) {
  const navigate = useNavigate();
  const planLabel = requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1);

  return (
    <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 text-center">
      <Lock className="w-5 h-5 text-slate-500 mx-auto mb-2" />
      <p className="text-sm text-slate-400 leading-snug">
        <span className="text-white font-medium">{featureName}</span>
        {' '}disponible en Plan{' '}
        <span className="text-blue-400 font-semibold">{planLabel}</span>
      </p>
      <button
        onClick={() => navigate('/dashboard/plan')}
        className="mt-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-4 py-2 text-xs font-semibold transition-colors"
      >
        Ver planes
      </button>
    </div>
  );
}
