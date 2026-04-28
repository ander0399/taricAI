import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Menu, X } from 'lucide-react';
import { slideInRight } from '../../styles/animations';

const NAV_LINKS = [
  { href: '/#soluciones', label: 'Soluciones' },
  { href: '/#planes',     label: 'Planes'     },
  { href: '/#fuentes',    label: 'Fuentes'    },
  { href: '/#contacto',   label: 'Contacto'   },
];

/**
 * @description Navbar pública (sin autenticar). Sticky glassmorphism con links
 *              de ancla a secciones de la Landing Page. En móvil despliega un
 *              panel lateral con AnimatePresence. Se cierra al seleccionar cualquier link.
 */
export default function PublicNavbar() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = () => setMobileOpen(false);

  return (
    <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/10">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2" onClick={closeMobile}>
          <Globe className="w-6 h-6 text-blue-400" />
          <span className="text-xl font-bold text-white">Taric AI</span>
        </Link>

        {/* Nav desktop */}
        <nav className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className="text-sm text-slate-300 hover:text-white transition-colors duration-200"
            >
              {label}
            </a>
          ))}
        </nav>

        {/* Acciones desktop */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={() => navigate('/login')}
            className="border border-white/30 text-white hover:bg-white/10 rounded-lg px-5 py-2.5 text-sm transition-colors duration-200"
          >
            Iniciar Sesión
          </button>
          <button
            onClick={() => navigate('/register')}
            className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            Comenzar Ahora
          </button>
        </div>

        {/* Hamburguesa móvil */}
        <button
          className="md:hidden text-slate-300 hover:text-white transition"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Abrir menú"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Panel móvil */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            {...slideInRight}
            className="fixed inset-y-0 right-0 w-72 bg-slate-900 border-l border-white/10 z-50 flex flex-col md:hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <span className="text-white font-semibold">Menú</span>
              <button onClick={closeMobile} className="text-slate-400 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex flex-col px-4 py-4 gap-1 flex-1">
              {NAV_LINKS.map(({ href, label }) => (
                <a
                  key={href}
                  href={href}
                  onClick={closeMobile}
                  className="px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-white/5 hover:text-white transition"
                >
                  {label}
                </a>
              ))}
            </nav>

            <div className="px-4 pb-6 flex flex-col gap-2 border-t border-white/10 pt-4">
              <button
                onClick={() => { navigate('/login'); closeMobile(); }}
                className="border border-white/30 text-white hover:bg-white/10 rounded-lg px-5 py-2.5 text-sm transition-colors duration-200 w-full"
              >
                Iniciar Sesión
              </button>
              <button
                onClick={() => { navigate('/register'); closeMobile(); }}
                className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 w-full"
              >
                Comenzar Ahora
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay oscuro detrás del panel móvil */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-slate-950/60 z-40 md:hidden"
            onClick={closeMobile}
          />
        )}
      </AnimatePresence>
    </header>
  );
}
