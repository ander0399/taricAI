import { motion } from 'framer-motion';
import { PenLine, Camera, FileText, Lock } from 'lucide-react';

const CARDS = [
  {
    method: 'text',
    icon: PenLine,
    iconClass: 'text-blue-400',
    title: 'Describir producto',
    subtitle: 'Escribe la descripción de tu mercancía',
    proOnly: false,
  },
  {
    method: 'image',
    icon: Camera,
    iconClass: 'text-blue-400',
    title: 'Subir foto del producto',
    subtitle: 'Toma una foto o sube una imagen',
    proOnly: false,
    pulseOnHover: true,
  },
  {
    method: 'ocr',
    icon: FileText,
    iconClass: 'text-emerald-400',
    title: 'Subir factura / ficha técnica',
    subtitle: 'GPT-4o extrae y clasifica automáticamente',
    proOnly: true,
  },
];

/**
 * @description Paso 1 — selector del método de entrada al clasificador.
 * La tarjeta OCR muestra badge "Plan Pro" + Lock si el plan es Free y redirige a /pricing.
 * @param {{ onSelect: Function, plan: string }} props
 */
export default function InputSelector({ onSelect, plan }) {
  const isFree = plan === 'free';

  const handleClick = (method, proOnly) => {
    if (proOnly && isFree) {
      window.location.href = '/pricing';
      return;
    }
    onSelect(method);
  };

  const containerVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
  const itemVariants = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">¿Cómo quieres clasificar tu producto?</h2>
        <p className="text-slate-400">Elige el método que mejor se adapte a tu mercancía</p>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {CARDS.map(({ method, icon: Icon, iconClass, title, subtitle, proOnly, pulseOnHover }) => {
          const locked = proOnly && isFree;
          return (
            <motion.button
              key={method}
              variants={itemVariants}
              onClick={() => handleClick(method, proOnly)}
              aria-label={title}
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(method, proOnly); }}
              className={`relative bg-slate-800 border border-slate-700 hover:border-blue-500/50 hover:bg-slate-700 rounded-2xl p-8 cursor-pointer transition-all duration-200 text-left group ${locked ? 'opacity-70' : ''}`}
            >
              {locked && (
                <div className="absolute top-3 right-3 flex items-center gap-1 bg-slate-700 rounded-full px-2 py-1">
                  <Lock className="w-3 h-3 text-slate-400" />
                  <span className="text-xs text-slate-400 font-medium">Plan Pro</span>
                </div>
              )}
              <Icon
                className={`w-12 h-12 mb-4 ${iconClass} ${pulseOnHover && !locked ? 'group-hover:animate-pulse' : ''}`}
              />
              <h3 className="text-white font-semibold text-base mb-1">{title}</h3>
              <p className="text-slate-400 text-sm leading-snug">{subtitle}</p>
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
}
