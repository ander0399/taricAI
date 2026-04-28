import { motion } from 'framer-motion';
import DashboardNavbar from '../../components/layout/DashboardNavbar';
import CurrentPlanCard from '../../components/plan/CurrentPlanCard';
import PlanSelector from '../../components/plan/PlanSelector';
import usePlan from '../../hooks/usePlan';
import { pageEnter, cardEnter } from '../../styles/animations';

/**
 * @description Página de gestión de plan en /dashboard/plan.
 *              Muestra el plan activo con barra de uso y permite al owner
 *              iniciar un cambio de plan. Los roles admin/member ven las
 *              tarjetas pero con botones deshabilitados.
 */
const PlanManagementPage = () => {
  const { currentPlan, usage, renewalDate, stripeStatus, cancelAtPeriodEnd, isLoading, error, refetch } = usePlan();

  return (
    <div className="min-h-screen bg-slate-900">
      <DashboardNavbar />

      <main className="max-w-5xl mx-auto px-4 py-10">
        <motion.div {...pageEnter}>
          <h1 className="text-3xl font-bold text-white mb-1">Mi Plan</h1>
          <p className="text-slate-400 mb-8">Gestiona tu suscripción y cambia de plan cuando quieras.</p>
        </motion.div>

        {error && (
          <div className="mb-6 bg-red-600/20 border border-red-500/40 rounded-xl p-4">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Plan activo */}
        <motion.section {...cardEnter(0)} className="mb-10">
          <h2 className="text-lg font-semibold text-slate-200 mb-4">Plan Actual</h2>
          <CurrentPlanCard
            plan={currentPlan}
            usage={usage}
            renewalDate={renewalDate}
            stripeStatus={stripeStatus}
            cancelAtPeriodEnd={cancelAtPeriodEnd}
            isLoading={isLoading}
          />
        </motion.section>

        {/* Selector de planes */}
        <motion.section {...cardEnter(0.1)}>
          <h2 className="text-lg font-semibold text-slate-200 mb-4">Cambiar de Plan</h2>
          <PlanSelector currentPlan={currentPlan} onPlanChange={refetch} />
        </motion.section>
      </main>
    </div>
  );
};

export default PlanManagementPage;
