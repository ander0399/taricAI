import { motion } from 'framer-motion';

const STATS = [
  { value: '10,000+', label: 'Clasificaciones realizadas' },
  { value: '50+',     label: 'Países cubiertos' },
  { value: '99.9%',   label: 'Precisión en datos' },
  { value: '24/7',    label: 'Actualización de fuentes' },
];

/**
 * @description Franja de métricas de confianza con animación de entrada.
 * @returns {JSX.Element}
 */
export default function TrustIndicators() {
  return (
    <section className="bg-slate-900/50 border-y border-white/5 py-12 px-4">
      <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
        {STATS.map(({ value, label }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="text-center"
          >
            <p className="text-4xl font-bold text-blue-400">{value}</p>
            <p className="text-sm text-slate-400 mt-1">{label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
