import { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Menu, X, LogOut, MessageSquare, LayoutDashboard, Users, User, ChevronDown } from 'lucide-react';
import { logout } from '../../store/slices/authSlice';

const PLAN_LABEL = { free: 'Free', pro: 'Pro', team: 'Team', enterprise: 'Enterprise' };

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
  { to: '/team',                    label: 'Equipos',     icon: Users           },
  { to: '/dashboard/plan',          label: 'Mi Plan'      },
];

export default function DashboardNavbar() {
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const { user, company } = useSelector((s) => s.auth);
  const plan = company?.plan || 'free';

  // Cierra el dropdown de perfil si se hace click fuera
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/', { replace: true });
  };

  const initial = user?.nombre?.[0]?.toUpperCase() || '?';

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
          {NAV.map((navItem) => (
            <NavLink key={navItem.to} to={navItem.to} className={linkClass}>
              {navItem.label}
            </NavLink>
          ))}
        </nav>

        {/* Acciones desktop */}
        <div className="hidden md:flex items-center gap-3">
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${PLAN_BADGE[plan]}`}>
            {PLAN_LABEL[plan]}
          </span>

          {/* Avatar + dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen((v) => !v)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {initial}
              </div>
              <span className="text-slate-300 text-sm max-w-[120px] truncate">{user?.nombre}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-52 bg-slate-800 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
                >
                  {/* Info del usuario */}
                  <div className="px-4 py-3 border-b border-white/10">
                    <p className="text-white text-sm font-medium truncate">{user?.nombre}</p>
                    <p className="text-slate-400 text-xs capitalize mt-0.5">{user?.role}</p>
                  </div>

                  <Link
                    to="/dashboard/profile"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    Mi Perfil
                  </Link>

                  <div className="border-t border-white/10" />

                  <button
                    onClick={() => { setProfileOpen(false); handleLogout(); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300 hover:text-red-400 hover:bg-white/5 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Cerrar sesión
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
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
              {NAV.map((navItem) => (
                <NavLink
                  key={navItem.to}
                  to={navItem.to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `px-3 py-2.5 rounded-lg text-sm font-medium transition ${isActive ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`
                  }
                >
                  {navItem.label}
                </NavLink>
              ))}

              <Link
                to="/dashboard/profile"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white transition"
              >
                <User className="w-4 h-4" />
                Mi Perfil
              </Link>

              <div className="border-t border-white/10 mt-2 pt-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                    {initial}
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{user?.nombre}</p>
                    <p className="text-slate-400 text-xs">Plan {PLAN_LABEL[plan]}</p>
                  </div>
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
