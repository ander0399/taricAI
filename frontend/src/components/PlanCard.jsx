import { Check } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * @description Tarjeta visual de plan de suscripción. Renderiza precio, features y CTA.
 * @param {string} name - Nombre del plan
 * @param {string} price - Precio a mostrar (ej. "$49/mes")
 * @param {string} description - Tagline del plan
 * @param {string[]} features - Lista de características incluidas
 * @param {JSX.Element} cta - Botón de acción (StripeBuyButton o link)
 * @param {boolean} highlighted - Si es true, aplica borde azul y badge "MÁS POPULAR"
 * @param {string} badgeLabel - Texto del badge opcional
 * @param {number} delay - Delay de animación Framer Motion
 * @returns {JSX.Element}
 */
export default function PlanCard({
  name,
  price,
  description,
  features,
  cta,
  highlighted = false,
  badgeLabel,
  delay = 0,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className={`relative flex flex-col rounded-2xl p-6 bg-slate-800/60 border ${
        highlighted
          ? 'border-2 border-blue-500 shadow-xl shadow-blue-500/20'
          : 'border-slate-700/50'
      }`}
    >
      {badgeLabel && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
          {badgeLabel}
        </span>
      )}

      <div className="mb-4">
        <h3 className="text-lg font-bold text-white">{name}</h3>
        <p className="text-slate-400 text-sm mt-1">{description}</p>
      </div>

      <div className="mb-6">
        <span className="text-4xl font-extrabold text-white">{price}</span>
      </div>

      <ul className="flex-1 space-y-3 mb-6">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
            <Check size={16} className="mt-0.5 text-emerald-400 shrink-0" />
            {f}
          </li>
        ))}
      </ul>

      <div>{cta}</div>
    </motion.div>
  );
}
