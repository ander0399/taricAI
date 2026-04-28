import { motion } from 'framer-motion';
import { Route, FileWarning, Calculator, ShieldAlert } from 'lucide-react';

const ITEMS = [
  {
    icon: Route,
    problem: 'Perder horas buscando subpartidas en portales de aduana lentos y complejos.',
    solution: 'Clasificación instantánea con un clic, impulsada por datos globales actualizados.',
  },
  {
    icon: FileWarning,
    problem: 'Descubrir en el puerto que falta un certificado fitosanitario o permiso técnico.',
    solution: 'Checklist automático de documentos obligatorios según la mercancía y la ruta.',
  },
  {
    icon: Calculator,
    problem: 'Presupuestos logísticos que fallan por tasas e impuestos locales no detectados.',
    solution: 'Desglose completo de aranceles, IVA/GST y gastos portuarios estimados en destino.',
  },
  {
    icon: ShieldAlert,
    problem: 'Sanciones por errores mínimos en la descripción o partida de la carga.',
    solution: 'Validación técnica y alertas de riesgo para asegurar un despacho de aduana fluido.',
  },
];

/**
 * @description Grid 2×2 con tarjetas de problema/solución animadas.
 * @returns {JSX.Element}
 */
export default function ProblemsSolutions() {
  return (
    <section id="soluciones" className="py-20 px-4 bg-slate-900">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-white">
            Problemas reales. Soluciones precisas.
          </h2>
          <p className="text-slate-400 mt-3 max-w-xl mx-auto text-sm">
            Conocemos los cuellos de botella del comercio exterior y los resolvemos con inteligencia artificial.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {ITEMS.map(({ icon: Icon, problem, solution }, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6"
            >
              <Icon size={28} className="text-rose-500 mb-3" />
              <p className="text-rose-400 font-semibold text-sm italic mb-3">{problem}</p>

              <div className="flex items-center gap-2 mb-3">
                <div className="h-px flex-1 bg-slate-700" />
                <span className="text-emerald-400 text-xs font-semibold whitespace-nowrap">
                  Solución Taric AI
                </span>
                <div className="h-px flex-1 bg-slate-700" />
              </div>

              <p className="text-slate-300 text-sm">{solution}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
