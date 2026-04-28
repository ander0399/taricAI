import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Zap, Globe } from 'lucide-react';

const BADGES = [
  { icon: ShieldCheck, label: 'Datos oficiales en tiempo real' },
  { icon: Zap,         label: '99.9% precisión' },
  { icon: Globe,       label: 'Cumplimiento global' },
];

/**
 * @description Sección Hero con título principal, subtítulo, badges de confianza y CTA.
 * @returns {JSX.Element}
 */
export default function HeroBanner() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 py-24 px-4">
      {/* Cuadrícula de fondo sutil */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            'linear-gradient(to right, #334155 1px, transparent 1px), linear-gradient(to bottom, #334155 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative max-w-5xl mx-auto text-center">
        {/* Título */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight"
        >
          Libera a tu equipo del{' '}
          <span className="text-blue-400">trabajo operativo pesado</span>
        </motion.h1>

        {/* Subtítulo */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="mt-6 text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed"
        >
          Taric AI automatiza la investigación de aranceles y regulaciones mundiales,
          entregando información verificada en tiempo real. Rapidez máxima en clasificación
          y claridad total en costos portuarios para que cierres negocios internacionales
          a la velocidad del mercado.
        </motion.p>

        {/* Badges de confianza */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-8 flex flex-wrap justify-center gap-3"
        >
          {BADGES.map(({ icon: Icon, label }) => (
            <span
              key={label}
              className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 text-sm text-slate-300"
            >
              <Icon size={15} className="text-emerald-400" />
              {label}
            </span>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.45 }}
          className="mt-10 flex justify-center"
        >
          <Link
            to="/register"
            className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3.5 rounded-xl text-base font-bold shadow-lg shadow-blue-600/30 transition"
          >
            Comenzar Gratis
          </Link>
        </motion.div>

        {/* Mockup del dashboard */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-16 mx-auto max-w-3xl"
        >
          <div className="rounded-2xl border border-white/10 bg-slate-800/60 shadow-2xl overflow-hidden">
            {/* Barra superior estilo app */}
            <div className="flex items-center gap-2 px-4 py-3 bg-slate-800 border-b border-white/10">
              <span className="w-3 h-3 rounded-full bg-rose-500" />
              <span className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="ml-4 text-xs text-slate-400">taricai.com / dashboard</span>
            </div>
            {/* Contenido del mockup */}
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-widest">Clasificación en progreso</p>
                  <p className="text-white font-semibold mt-1">Manzanas frescas — Capítulo 08</p>
                </div>
                <span className="text-xs bg-blue-600/30 text-blue-300 border border-blue-500/30 px-3 py-1 rounded-full animate-pulse">
                  Analizando...
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {['Subpartida: 0808.10', 'Arancel: 12%', 'País destino: DE'].map((item) => (
                  <div key={item} className="bg-slate-700/50 rounded-lg px-3 py-2 text-xs text-slate-300">
                    {item}
                  </div>
                ))}
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full w-3/4 bg-gradient-to-r from-blue-600 to-blue-400 rounded-full" />
              </div>
              <p className="text-xs text-slate-500 text-right">75% — validando regulaciones...</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
