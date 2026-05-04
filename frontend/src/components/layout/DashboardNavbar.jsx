import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Menu, X, LogOut, MessageSquare, LayoutDashboard, Users } from 'lucide-react';
import { logout } from '../../store/slices/authSlice';

const PLAN_LABEL = { free: 'Free', pro: 'Pro', team: 'Team', enterprise: 'Enterprise' };

/** Clases de badge según plan — sistema de diseño oficial */
const PLAN_BADGE = {
  free:       'bg-slate-700 text-slate-300 border border-slate-600',
  pro:        'bg-blue-600/20 text-blue-300 border border-blue-500/30',
  team:       'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30',
  enterprise: 'bg-purple-600/20 text-purple-300 border border-purple-500/30',
};

const NAV = [
  { to: '/dashboard',               label: 'Dashboard',   icon: LayoutDashboard },
  { to: '/classifier',              label: 'Clasificador' },
  { to: '/classifier?view=history', label: 'Historial'   },
  { to: '/dashboard/chat',          label: 'Chat de IA',  icon: MessageSquare   },
  { to: '/team',                    label: 'Equipos',      icon: Users           },
  { to: '/dashboard/plan',          label: 'Mi Plan'      },
];

/**
 * @description Navbar sticky de la app autenticada (módulo clasificador y vistas internas).
 * Paleta dark heredada del sistema de diseño de la Landing Page.
 * Responsive: menú hamburguesa en móvil con animación Framer Motion.
 */
export default function DashboardNavbar() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const { user, company } = useSelector((s) => s.auth);
  const plan = company?.plan || 'free';

  const handleLogout = () => {
    dispatch(logout());
    // Redirigir a / porque el usuario cerró sesión voluntariamente —
    // la Landing Page es el punto de entrada natural, no el login.
    navigate('/', { replace: true });
  };

  const linkClass = ({ isActive }) =>
    `text-sm transition font-medium ${isActive ? 'text-white' : 'text-slate-300 hover:text-white'}`;

  return (
    <header className="bg-slate-900/80 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">

        {/* Logo */}
        <NavLink to="/dashboard" className="flex items-center gap-2">
          <Globe className="w-6 h-6 text-blue-400" />
          <span className="text-xl font-bold text-white">Taric AI</span>
        </NavLink>

        {/* Nav desktop */}
        <nav className="hidden md:flex items-center gap-6">
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} className={linkClass}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Acciones desktop */}
        <div className="hidden md:flex items-center gap-3">
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${PLAN_BADGE[plan]}`}>
            {PLAN_LABEL[plan]}
          </span>
          <span className="text-slate-300 text-sm">{user?.nombre}</span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors duration-200 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Salir
          </button>
        </div>

        {/* Hamburguesa móvil */}
        <button
          className="md:hidden text-slate-300 hover:text-white transition"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Menú"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Menú móvil */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-white/10 bg-slate-900/95 md:hidden"
          >
            <nav className="flex flex-col px-4 py-3 gap-1">
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `px-3 py-2.5 rounded-lg text-sm font-medium transition ${isActive ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              <div className="border-t border-white/10 mt-2 pt-3 flex items-center justify-between">
                <div>
                  <p className="text-white text-sm font-medium">{user?.nombre}</p>
                  <p className="text-slate-400 text-xs">Plan {PLAN_LABEL[plan]}</p>
                </div>
                <button onClick={handleLogout} className="text-slate-400 hover:text-red-400 transition">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
