import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BarChart3, Target, TrendingUp, CheckCircle2,
  FileSearch, MessageSquare, Users, ArrowRight,
  Clock, Package, ChevronRight, Zap,
} from 'lucide-react';
import api from '../services/api';
import DashboardNavbar from '../components/layout/DashboardNavbar';
import RiskMapSection from '../components/riskMap/RiskMapSection';
import TrackingSection from '../components/tracking/TrackingSection';

const PLAN_BADGE = {
  free:       'bg-slate-700 text-slate-300 border border-slate-600',
  pro:        'bg-blue-600/20 text-blue-300 border border-blue-500/30',
  team:       'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30',
  enterprise: 'bg-purple-600/20 text-purple-300 border border-purple-500/30',
};
const PLAN_LABEL = { free: 'Free', pro: 'Pro', team: 'Team', enterprise: 'Enterprise' };

const QUICK_ACTIONS = [
  {
    to: '/classifier',
    icon: FileSearch,
    title: 'Nueva Clasificación',
    desc: 'Clasifica productos por código HS arancelario',
    gradient: 'from-blue-600/25 to-blue-800/10',
    border: 'border-blue-500/20 hover:border-blue-400/50',
    iconColor: 'text-blue-400',
  },
  {
    to: '/dashboard/chat',
    icon: MessageSquare,
    title: 'Chat de IA',
    desc: 'Consulta aranceles, regulaciones y documentos',
    gradient: 'from-purple-600/25 to-purple-800/10',
    border: 'border-purple-500/20 hover:border-purple-400/50',
    iconColor: 'text-purple-400',
  },
  {
    to: '/team',
    icon: Users,
    title: 'Mi Equipo',
    desc: 'Gestiona miembros, roles y permisos',
    gradient: 'from-emerald-600/25 to-emerald-800/10',
    border: 'border-emerald-500/20 hover:border-emerald-400/50',
    iconColor: 'text-emerald-400',
  },
];

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};
const item = {
  hidden:  { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.38, ease: 'easeOut' } },
};

const greeting = () => {
  const h = new Date().getHours();
  if (h >= 6 && h < 12) return 'Buenos días';
  if (h >= 12 && h < 19) return 'Buenas tardes';
  return 'Buenas noches';
};

const relativeTime = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'ahora';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
};

export default function Dashboard() {
  const { user, company } = useSelector((s) => s.auth);
  const [usage, setUsage]           = useState(null);
  const [recientes, setRecientes]   = useState([]);
  const [loadingRec, setLoadingRec] = useState(true);

  const plan = company?.plan || 'free';

  useEffect(() => {
    api.get('/classifications/usage').then((r) => setUsage(r.data.data)).catch(() => {});
    api.get('/classifications?limit=4&page=1')
      .then((r) => setRecientes(r.data.data?.rows || []))
      .catch(() => {})
      .finally(() => setLoadingRec(false));
  }, []);

  const firstName = user?.nombre?.split(' ')[0] || user?.nombre || '';

  return (
    <motion.div
      className="min-h-screen bg-slate-900 flex flex-col"
      variants={container}
      initial="hidden"
      animate="visible"
    >
      <DashboardNavbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* ── Welcome ── */}
        <motion.div variants={item} className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white leading-tight">
              {greeting()},{' '}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                {firstName}
              </span>
            </h1>
            <p className="text-slate-400 mt-1 text-sm">
              <span className="capitalize">{user?.role}</span>
              {company?.nombre ? ` · ${company.nombre}` : ''}
            </p>
          </div>
          <span className={`self-start mt-1 px-3 py-1.5 rounded-full text-xs font-semibold ${PLAN_BADGE[plan]}`}>
            Plan {PLAN_LABEL[plan]}
          </span>
        </motion.div>

        {/* ── KPI Stats ── */}
        <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            icon={BarChart3}
            label="Este mes"
            value={usage?.usado ?? '—'}
            sub="clasificaciones"
            color="blue"
          />
          <StatCard
            icon={Target}
            label="Límite del plan"
            value={usage?.limite ?? '—'}
            sub={`Plan ${PLAN_LABEL[plan]}`}
            color="purple"
          />
          <StatCard
            icon={TrendingUp}
            label="Uso actual"
            value={usage ? `${usage.porcentaje}%` : '—'}
            sub={usage?.mes || ''}
            color={usage?.porcentaje >= 80 ? 'amber' : 'emerald'}
            progress={usage?.porcentaje}
          />
          <StatCard
            icon={CheckCircle2}
            label="Estado cuenta"
            value="Activo"
            sub="al día"
            color="emerald"
          />
        </motion.div>

        {/* ── Quick Actions ── */}
        <motion.div variants={item}>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
            Acceso rápido
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {QUICK_ACTIONS.map((a) => (
              <Link key={a.to} to={a.to}>
                <motion.div
                  whileHover={{ scale: 1.02, y: -3 }}
                  whileTap={{ scale: 0.98 }}
                  className={`bg-gradient-to-br ${a.gradient} border ${a.border} rounded-xl p-5 h-full transition-colors duration-200 cursor-pointer`}
                >
                  <a.icon className={`w-7 h-7 mb-3 ${a.iconColor}`} />
                  <h3 className="text-white font-semibold mb-1 text-sm">{a.title}</h3>
                  <p className="text-slate-400 text-xs leading-relaxed">{a.desc}</p>
                  <div className="flex items-center gap-1 mt-3 text-slate-500 text-xs">
                    <span>Ir ahora</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* ── Mapa de Riesgo País · TARIC 360° ── */}
        <motion.div variants={item}>
          <RiskMapSection />
        </motion.div>

        {/* ── Mapa de Trazabilidad de Carga ── */}
        <motion.div variants={item}>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
            Trazabilidad de Carga en Tiempo Real
          </h2>
          <TrackingSection />
        </motion.div>

        {/* ── Bottom: Activity + Plan ── */}
        <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Recent Activity */}
          <div className="lg:col-span-2 bg-slate-800 rounded-xl border border-white/10 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                Actividad reciente
              </h2>
              <Link
                to="/classifier?view=history"
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-0.5 transition-colors"
              >
                Ver todo <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {loadingRec ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 bg-slate-700/40 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : recientes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Package className="w-10 h-10 text-slate-700 mb-3" />
                <p className="text-slate-500 text-sm">Aún no hay clasificaciones</p>
                <Link
                  to="/classifier"
                  className="text-blue-400 hover:text-blue-300 text-xs mt-2 transition-colors"
                >
                  Crear primera clasificación →
                </Link>
              </div>
            ) : (
              <div className="space-y-1">
                {recientes.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <div className="flex-shrink-0 w-[68px]">
                      <span className="text-xs font-mono font-bold text-blue-400 bg-blue-400/10 px-2 py-1 rounded tracking-wide">
                        {r.hsCode || '—'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm truncate">
                        {r.inputType === 'text' ? r.inputData : 'Clasificación por imagen/OCR'}
                      </p>
                      <p className="text-slate-500 text-xs mt-0.5">
                        {r.originCountry || '?'} → {r.destCountry || '?'}
                      </p>
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-1 text-slate-600 text-xs">
                      <Clock className="w-3 h-3" />
                      {relativeTime(r.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Plan Card */}
          <div className="bg-slate-800 rounded-xl border border-white/10 p-6 flex flex-col">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">
              Mi plan
            </h2>

            <span className={`inline-block self-start px-3 py-1 rounded-full text-xs font-semibold mb-4 ${PLAN_BADGE[plan]}`}>
              {PLAN_LABEL[plan]}
            </span>

            {usage && (
              <div className="mb-5">
                <div className="flex justify-between text-xs text-slate-400 mb-2">
                  <span>{usage.usado} / {usage.limite} usadas</span>
                  <span>{usage.porcentaje}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      usage.porcentaje >= 100 ? 'bg-red-500'
                      : usage.porcentaje >= 80  ? 'bg-amber-400'
                      : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min(usage.porcentaje, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-slate-600 mt-1.5">{usage.mes}</p>
              </div>
            )}

            <div className="flex-1" />

            {plan === 'free' && (
              <>
                <p className="text-slate-500 text-xs mb-3 leading-relaxed">
                  Desbloquea más clasificaciones, IA avanzada y exportación PDF.
                </p>
                <Link to="/dashboard/plan">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-all duration-200 cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    Mejorar plan
                  </motion.div>
                </Link>
              </>
            )}

            {plan !== 'free' && (
              <Link
                to="/dashboard/plan"
                className="text-xs text-slate-500 hover:text-slate-300 text-center block transition-colors"
              >
                Gestionar plan →
              </Link>
            )}
          </div>
        </motion.div>

      </main>
    </motion.div>
  );
}

function StatCard({ icon: Icon, label, value, sub, color, progress }) {
  const palette = {
    blue:    'text-blue-400   bg-blue-400/10',
    purple:  'text-purple-400 bg-purple-400/10',
    emerald: 'text-emerald-400 bg-emerald-400/10',
    amber:   'text-amber-400  bg-amber-400/10',
  };
  return (
    <div className="bg-slate-800 rounded-xl border border-white/10 p-5">
      <div className={`inline-flex p-2 rounded-lg mb-3 ${palette[color]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl font-bold text-white leading-none mb-0.5">{value}</p>
      <p className="text-xs text-slate-600">{sub}</p>
      {progress !== undefined && (
        <div className="w-full bg-slate-700 rounded-full h-1 mt-2.5">
          <div
            className={`h-1 rounded-full transition-all duration-500 ${
              progress >= 100 ? 'bg-red-500' : progress >= 80 ? 'bg-amber-400' : 'bg-blue-500'
            }`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}
