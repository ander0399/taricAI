import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import AppLayout from '../components/AppLayout';

const PLAN_COLORS = {
  free:     'bg-gray-100 text-gray-700',
  starter:  'bg-blue-100 text-blue-700',
  pro:      'bg-purple-100 text-purple-700',
  business: 'bg-amber-100 text-amber-700',
};

const Dashboard = () => {
  const { t } = useTranslation();
  const { user, company } = useSelector((s) => s.auth);
  const [usage, setUsage] = useState(null);

  useEffect(() => {
    api.get('/classifications/usage')
      .then((res) => setUsage(res.data.data))
      .catch(() => {});
  }, []);

  return (
    <AppLayout>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">
        {t('dashboard.welcome', { nombre: user?.nombre })}
      </h1>
      <p className="text-gray-400 text-sm mb-8 capitalize">{user?.role}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Plan */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            {t('dashboard.plan')}
          </p>
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${PLAN_COLORS[company?.plan] || PLAN_COLORS.free}`}>
            {t(`plans.${company?.plan || 'free'}`)}
          </span>
        </div>

        {/* Uso mensual */}
        {usage && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              {t('dashboard.usage')}
            </p>
            <p className="text-lg font-bold text-gray-900 mb-3">
              {t('dashboard.classifications_used', { usado: usage.usado, limite: usage.limite })}
            </p>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  usage.porcentaje >= 100 ? 'bg-red-500'
                  : usage.porcentaje >= 80  ? 'bg-amber-400'
                  : 'bg-primary-600'
                }`}
                style={{ width: `${Math.min(usage.porcentaje, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1.5">{usage.porcentaje}% — {usage.mes}</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Dashboard;
