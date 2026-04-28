import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const FAQS = [
  {
    q: '¿Taric AI reemplaza a mi agente de aduanas?',
    a: 'No. Taric AI es una herramienta de asistencia tecnológica que acelera la investigación y reduce errores operativos. La declaración final ante aduanas debe ser supervisada por profesionales del sector. Taric AI es el copiloto inteligente de tu equipo logístico.',
  },
  {
    q: '¿Qué pasa si excedo mi límite de consultas mensuales?',
    a: 'Recibirás una notificación con opciones para actualizar tu plan de forma inmediata. No interrumpimos tu operación sin aviso. Las consultas adicionales quedan en cola hasta la renovación o upgrade del plan.',
  },
  {
    q: '¿Puedo cambiar de plan en cualquier momento?',
    a: 'Sí. Los upgrades se aplican de inmediato con prorrateo automático gestionado por Stripe. Los downgrades se aplican al finalizar el ciclo actual. Sin contratos ni penalizaciones.',
  },
  {
    q: '¿Cómo funciona la facturación del Plan Team?',
    a: 'Pagas $29 USD por cada usuario activo al mes. Si agregas un miembro a mitad del ciclo, Stripe calcula y cobra solo los días proporcionales. Si desactivas un usuario, se genera un crédito automático para el siguiente período.',
  },
  {
    q: '¿Mis datos están seguros?',
    a: 'Sí. Toda la información se transmite con cifrado SSL/TLS. Los datos de tu empresa están completamente aislados de otros clientes (arquitectura Multi-tenant). Para requerimientos de máxima privacidad, el Plan Enterprise ofrece instalación Self-Hosted en servidores propios.',
  },
];

/**
 * @description Acordeón de preguntas frecuentes con animación de apertura/cierre.
 * @returns {JSX.Element}
 */
export default function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState(null);

  function toggle(i) {
    setOpenIndex((prev) => (prev === i ? null : i));
  }

  return (
    <section className="py-20 px-4 bg-slate-900">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="text-3xl font-bold text-white">Preguntas frecuentes</h2>
        </motion.div>

        <div className="space-y-3">
          {FAQS.map(({ q, a }, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              className="bg-slate-800/50 border border-slate-700/50 rounded-lg overflow-hidden"
            >
              <button
                onClick={() => toggle(i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left"
              >
                <span className="font-semibold text-slate-200 text-sm pr-4">{q}</span>
                <motion.span
                  animate={{ rotate: openIndex === i ? 180 : 0 }}
                  transition={{ duration: 0.25 }}
                  className="shrink-0 text-slate-400"
                >
                  <ChevronDown size={18} />
                </motion.span>
              </button>

              <AnimatePresence initial={false}>
                {openIndex === i && (
                  <motion.div
                    key="content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 pb-4 text-slate-400 text-sm leading-relaxed">{a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
