import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Menu, X } from 'lucide-react';

const NAV_LINKS = [
  { label: 'Soluciones', href: '#soluciones' },
  { label: 'Planes', href: '#planes' },
  { label: 'Fuentes', href: '#fuentes' },
  { label: 'Contacto', href: '#contacto' },
];

/**
 * @description Barra de navegación fija con menú responsive y animación de hamburguesa.
 * @returns {JSX.Element}
 */
export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <Globe size={22} className="text-blue-400" />
          <span className="text-xl font-bold text-white tracking-tight">Taric AI</span>
        </Link>

        {/* Links desktop */}
        <nav className="hidden md:flex items-center gap-7">
          {NAV_LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="text-slate-300 hover:text-white transition text-sm"
            >
              {l.label}
            </a>
          ))}
        </nav>

        {/* Acciones desktop */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/login"
            className="border border-white/30 text-white hover:bg-white/10 rounded-lg px-4 py-2 text-sm transition"
          >
            Iniciar Sesión
          </Link>
          <Link
            to="/register"
            className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-5 py-2 text-sm font-semibold transition"
          >
            Comenzar Ahora
          </Link>
        </div>

        {/* Hamburguesa móvil */}
        <button
          className="md:hidden text-slate-300 hover:text-white transition"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Menú móvil con Framer Motion */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="md:hidden overflow-hidden bg-slate-900 border-t border-white/10"
          >
            <div className="px-4 py-4 flex flex-col gap-3">
              {NAV_LINKS.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="text-slate-300 hover:text-white text-sm py-1 transition"
                >
                  {l.label}
                </a>
              ))}
              <hr className="border-white/10 my-1" />
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="border border-white/30 text-white hover:bg-white/10 rounded-lg px-4 py-2 text-sm text-center transition"
              >
                Iniciar Sesión
              </Link>
              <Link
                to="/register"
                onClick={() => setOpen(false)}
                className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-4 py-2 text-sm font-semibold text-center transition"
              >
                Comenzar Ahora
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
