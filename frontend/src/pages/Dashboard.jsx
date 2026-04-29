import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import api from '../services/api';
import DashboardNavbar from '../components/layout/DashboardNavbar';
import { pageEnter } from '../styles/animations';

const PLAN_BADGE = {
  free:       'bg-slate-700 text-slate-300 border border-slate-600',
  pro:        'bg-blue-600/20 text-blue-300 border border-blue-500/30',
  team:       'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30',
  enterprise: 'bg-purple-600/20 text-purple-300 border border-purple-500/30',
};

const PLAN_LABEL = { free: 'Free', pro: 'Pro', team: 'Team', enterprise: 'Enterprise' };

const Dashboard = () => {
  const { t } = useTranslation();
  const { user, company } = useSelector((s) => s.auth);
  const [usage, setUsage] = useState(null);

  useEffect(() => {
    api.get('/classifications/usage')
      .then((res) => setUsage(res.data.data))
      .catch(() => {});
  }, []);

  const plan = company?.plan || 'free';

  return (
    <motion.div className="min-h-screen bg-slate-900 flex flex-col" {...pageEnter}>
      <DashboardNavbar />
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-8">

        <h1 className="text-2xl font-bold text-white mb-1">
          {t('dashboard.welcome', { nombre: user?.nombre })}
        </h1>
        <p className="text-slate-400 text-sm mb-8 capitalize">{user?.role}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Plan */}
          <div className="bg-slate-800 rounded-xl border border-white/10 p-6">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
              {t('dashboard.plan')}
            </p>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${PLAN_BADGE[plan]}`}>
              {PLAN_LABEL[plan]}
            </span>
          </div>

          {/* Uso mensual */}
          {usage && (
            <div className="bg-slate-800 rounded-xl border border-white/10 p-6">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                {t('dashboard.usage')}
              </p>
              <p className="text-lg font-bold text-white mb-3">
                {t('dashboard.classifications_used', { usado: usage.usado, limite: usage.limite })}
              </p>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    usage.porcentaje >= 100 ? 'bg-red-500'
                    : usage.porcentaje >= 80  ? 'bg-amber-400'
                    : 'bg-blue-500'
                  }`}
                  style={{ width: `${Math.min(usage.porcentaje, 100)}%` }}
                />
              </div>
              <p className="text-xs text-slate-400 mt-1.5">{usage.porcentaje}% — {usage.mes}</p>
            </div>
          )}
        </div>

      </main>
    </motion.div>
  );
};

export default Dashboard;
