import { useEffect, useState } from 'react';
import api from '../services/api';

/**
 * Muestra un banner de advertencia cuando el consumo de clasificaciones supera el 80%.
 * Se auto-oculta si el uso está por debajo del umbral.
 */
const UsageBanner = () => {
  const [usage, setUsage] = useState(null);

  useEffect(() => {
    api.get('/classifications/usage')
      .then((res) => setUsage(res.data.data))
      .catch(() => {});
  }, []);

  if (!usage || usage.porcentaje < 80) return null;

  const isCritical = usage.porcentaje >= 100;

  return (
    <div className={`px-6 py-3 text-sm font-medium flex items-center gap-3 ${
      isCritical ? 'bg-red-50 border-b border-red-200 text-red-800' : 'bg-amber-50 border-b border-amber-200 text-amber-800'
    }`}>
      <span>{isCritical ? '🚫' : '⚠️'}</span>
      <span>
        {isCritical
          ? `Límite alcanzado: ${usage.usado}/${usage.limite} clasificaciones este mes. Actualiza tu plan para continuar.`
          : `Advertencia: llevas ${usage.porcentaje}% de tu límite mensual (${usage.usado}/${usage.limite} clasificaciones).`
        }
      </span>
      {isCritical && (
        <a href="/billing" className="ml-auto underline font-semibold whitespace-nowrap">
          Actualizar plan →
        </a>
      )}
    </div>
  );
};

export default UsageBanner;
