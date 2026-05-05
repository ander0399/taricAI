import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Loader2 } from 'lucide-react';
import { useClassification } from '../../hooks/useClassification';
import InputSelector from './InputSelector';
import TextClassifier from './TextClassifier';
import ImageUploader from './ImageUploader';
import OCRUploader from './OCRUploader';
import ClassificationQuestions from './ClassificationQuestions';
import ProductDescription from './ProductDescription';
import CountrySelector from './CountrySelector';
import ResultsPanel from './ResultsPanel';
import ClassificationHistory from './ClassificationHistory';
import ClassifierErrorState from './ClassifierErrorState';
import UpgradeModal from './UpgradeModal';

const STEPS = [
  { label: 'Método'    },
  { label: 'Analizar'  },
  { label: 'Clarificar'},
  { label: 'Confirmar' },
  { label: 'Países'    },
  { label: 'Resultados'},
];

/**
 * @description Barra de progreso visual del clasificador — 6 pasos.
 * Adapts step labels based on inputMethod (step 3 skipped for image/ocr).
 */
function Stepper({ step, inputMethod }) {
  const visibleSteps = inputMethod && inputMethod !== 'text'
    ? STEPS.filter((_, i) => i !== 2) // Sin "Clarificar" para imagen/OCR
    : STEPS;

  const getDisplayStep = (stepIndex) => {
    if (inputMethod && inputMethod !== 'text') {
      if (step === 1) return 1;
      if (step === 2) return 2;
      if (step >= 4) return step - 1; // Shift back since step 3 is skipped
    }
    return step;
  };

  const displayStep = getDisplayStep(step);

  return (
    <div className="bg-slate-800/50 border-b border-white/10 py-4 px-6">
      <div className="max-w-3xl mx-auto flex items-center justify-center gap-0">
        {visibleSteps.map((s, i) => {
          const num = i + 1;
          const isCompleted = displayStep > num;
          const isActive    = displayStep === num;

          return (
            <div key={i} className="flex items-center">
              {/* Círculo */}
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                  isCompleted ? 'bg-emerald-600 text-white'
                  : isActive  ? 'bg-blue-600 text-white'
                              : 'bg-slate-700 text-slate-400'
                }`}>
                  {isCompleted ? <Check className="w-4 h-4" /> : num}
                </div>
                <span className={`text-xs mt-1 hidden sm:block ${
                  isActive ? 'text-blue-400' : isCompleted ? 'text-emerald-400' : 'text-slate-500'
                }`}>
                  {s.label}
                </span>
              </div>
              {/* Línea conectora */}
              {i < visibleSteps.length - 1 && (
                <div className={`h-0.5 w-8 sm:w-12 mx-1 transition-colors ${
                  displayStep > num ? 'bg-emerald-600' : 'bg-slate-700'
                }`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * @description Orquestador visual del clasificador arancelario en 6 pasos.
 * Gestiona el estado del flujo completo vía useClassification hook.
 * @param {{ plan: string, showHistory?: boolean, onToggleHistory?: Function }} props
 */
export default function ClassifierLayout({ plan, showHistory, onToggleHistory }) {
  const {
    step, inputMethod, result, loading, error, upgradeError,
    textDescription, questions, productDescription, imageUrl,
    setProductDescription,
    selectMethod, handleTextAnalyze, handleQuestionsComplete,
    handleDocumentAnalyzed, handleDescriptionConfirmed,
    handleFinalSubmit, reset, goToStep,
  } = useClassification();

  const { user } = useSelector((s) => s.auth);

  const slideVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit:    { opacity: 0, x: -20 },
  };

  // ── Render de cada paso ───────────────────────────────────────────────────────
  const renderStep = () => {
    if (error) {
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <ClassifierErrorState message={error} onRetry={() => goToStep(step)} />
        </div>
      );
    }

    switch (step) {
      case 1:
        return <InputSelector onSelect={selectMethod} plan={plan} />;

      case 2:
        if (inputMethod === 'image') {
          return <ImageUploader onAnalyzed={handleDocumentAnalyzed} language={user?.idioma || 'es'} />;
        }
        if (inputMethod === 'ocr') {
          return <OCRUploader onAnalyzed={handleDocumentAnalyzed} language={user?.idioma || 'es'} />;
        }
        return <TextClassifier onAnalyze={handleTextAnalyze} loading={loading} />;

      case 3:
        return (
          <ClassificationQuestions
            questions={questions}
            onComplete={handleQuestionsComplete}
          />
        );

      case 4:
        return (
          <ProductDescription
            description={productDescription}
            primaryHsCode={null}
            onConfirm={handleDescriptionConfirmed}
            loading={loading}
          />
        );

      case 5:
        return <CountrySelector onSubmit={handleFinalSubmit} loading={loading} />;

      case 6:
        return (
          <ResultsPanel
            result={result}
            exporterCountry={result?.exporterCountry}
            importerCountry={result?.importerCountry}
            plan={plan}
            onNewClassification={reset}
            onReclassify={() => goToStep(4)}
          />
        );

      default:
        return null;
    }
  };

  // ── Vista de historial ────────────────────────────────────────────────────────
  if (showHistory) {
    return (
      <div className="min-h-screen bg-slate-900">
        <ClassificationHistory onNewClassification={() => { if (onToggleHistory) onToggleHistory(false); reset(); }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Stepper */}
      {step < 6 && <Stepper step={step} inputMethod={inputMethod} />}

      {/* Contenido del paso con transición */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          variants={slideVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.18, ease: 'easeInOut' }}
        >
          {renderStep()}
        </motion.div>
      </AnimatePresence>

      {/* Overlay de procesamiento IA */}
      {loading && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl px-10 py-8 flex flex-col items-center gap-5 shadow-2xl max-w-sm w-full mx-4">
            <div className="relative">
              <Loader2 className="w-12 h-12 text-blue-400 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-5 h-5 rounded-full bg-blue-500/20 animate-ping" />
              </div>
            </div>
            <div className="text-center space-y-1">
              <p className="text-white font-semibold text-lg">
                {step >= 5 ? 'Investigando aranceles' : 'Analizando producto'}
              </p>
              <p className="text-slate-400 text-sm">
                {step >= 5
                  ? 'Consultando fuentes arancelarias oficiales...'
                  : 'Procesando descripción con IA...'}
              </p>
              {step >= 5 && (
                <p className="text-slate-500 text-xs mt-2">
                  Esto puede tomar unos segundos
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de upgrade cuando se supera el límite del plan */}
      <UpgradeModal
        isOpen={!!upgradeError}
        onClose={() => {/* clearUpgradeError ya se dispara desde el hook */}}
        errorData={upgradeError}
      />
    </div>
  );
}
