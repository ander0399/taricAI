import { useState } from 'react';
import { motion } from 'framer-motion';

/**
 * @description Paso 3 — preguntas dinámicas de clarificación generadas por gpt-4o-mini.
 * El usuario responde con chips seleccionables. El botón "Continuar" se activa cuando
 * todas las preguntas tienen respuesta.
 * @param {{ questions: Array, onComplete: Function }} props
 */
export default function ClassificationQuestions({ questions, onComplete }) {
  const [answers, setAnswers] = useState({});

  const handleSelect = (questionId, answer) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const allAnswered = questions.length > 0 && questions.every((q) => answers[q.id]);

  const handleContinue = () => {
    if (!allAnswered) return;
    const formatted = Object.entries(answers).map(([questionId, answer]) => ({ questionId, answer }));
    onComplete(formatted);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white mb-1">Necesitamos más información</h2>
        <p className="text-slate-400 text-sm">Responde estas preguntas para mejorar la precisión de la clasificación.</p>
      </div>

      <div className="space-y-6">
        {questions.map((q, qi) => (
          <motion.div
            key={q.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: qi * 0.06 }}
            className="space-y-2"
          >
            <p className="text-white text-sm font-medium">{q.text}</p>
            <div className="flex flex-wrap gap-2">
              {(q.options || []).map((opt) => {
                const selected = answers[q.id] === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => handleSelect(q.id, opt)}
                    className={`px-4 py-2 rounded-full text-sm cursor-pointer transition border ${
                      selected
                        ? 'bg-blue-600/20 border-blue-500 text-blue-300 font-medium'
                        : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-blue-600/10 hover:border-blue-500/50'
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>

      <button
        onClick={handleContinue}
        disabled={!allAnswered}
        className={`w-full rounded-lg py-3 font-bold text-white transition ${
          allAnswered
            ? 'bg-emerald-600 hover:bg-emerald-500'
            : 'bg-slate-700 opacity-50 cursor-not-allowed'
        }`}
      >
        Continuar
      </button>
    </div>
  );
}
