import { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import {
  setStep, setInputMethod, setResult, setLoading,
  setError, setUpgradeError, resetClassifier,
} from '../store/slices/classifierSlice';
import {
  getClassificationQuestions, classifyByText,
  classifyByImage, classifyByOCR,
} from '../services/classifier.api';

/**
 * @description Hook principal que orquesta el flujo de clasificación arancelaria.
 * Gestiona el estado multi-paso (descripción, preguntas, respuestas, imagen, países)
 * y realiza todas las llamadas a la API, detectando errores 429 (límite de plan).
 *
 * El estado global (step, result, loading, error) vive en Redux.
 * El estado de flujo (descripción, preguntas, respuestas, imageUrl) vive en el hook (local).
 */
export function useClassification() {
  const dispatch = useDispatch();
  const { step, inputMethod, result, loading, error, upgradeError } = useSelector((s) => s.classifier);
  const { i18n } = useTranslation();
  const language = i18n.language?.slice(0, 2) || 'es';

  // ── Estado local del flujo (no necesita persistir entre sesiones) ───────────
  const [textDescription,    setTextDescription]    = useState('');
  const [questions,           setQuestions]           = useState([]);
  const [clarificationAnswers, setClarificationAnswers] = useState([]);
  const [productDescription,  setProductDescription]  = useState('');
  const [imageUrl,            setImageUrl]            = useState(null);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const handleApiError = useCallback((err) => {
    if (err.response?.status === 429) {
      dispatch(setUpgradeError(err.response.data));
    } else {
      dispatch(setError(err.response?.data?.message || 'Error inesperado. Intenta de nuevo.'));
    }
  }, [dispatch]);

  // ── Paso 1: seleccionar método de entrada ────────────────────────────────────
  const selectMethod = useCallback((method) => {
    dispatch(setInputMethod(method)); // también avanza step → 2
  }, [dispatch]);

  // ── Paso 2A: enviar texto → obtener preguntas de clarificación ───────────────
  const handleTextAnalyze = useCallback(async (description) => {
    dispatch(setLoading(true));
    dispatch(setError(null));
    setTextDescription(description);
    try {
      const res = await getClassificationQuestions(description, language);
      const data = res.data.data;
      setQuestions(data.questions || []);
      dispatch(setStep(3));
    } catch (err) {
      handleApiError(err);
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch, language, handleApiError]);

  // ── Paso 3: respuestas de clarificación completadas → ir a Paso 4 ────────────
  const handleQuestionsComplete = useCallback((answers) => {
    setClarificationAnswers(answers);
    // Para texto, la descripción confirmada es la que el usuario ingresó
    setProductDescription(textDescription);
    dispatch(setStep(4));
  }, [dispatch, textDescription]);

  // ── Paso 2B/2C: resultado del análisis de imagen/OCR (Etapa 1) ───────────────
  const handleDocumentAnalyzed = useCallback((data) => {
    setProductDescription(data.productDescription || '');
    setImageUrl(data.imageUrl || null);
    dispatch(setStep(4));
  }, [dispatch]);

  // ── Paso 4 → Paso 5 (descripción confirmada) ────────────────────────────────
  const handleDescriptionConfirmed = useCallback((confirmedDescription) => {
    setProductDescription(confirmedDescription);
    dispatch(setStep(5));
  }, [dispatch]);

  // ── Paso 5: submit final con países → clasificación completa ─────────────────
  const handleFinalSubmit = useCallback(async (exporterIso3, importerIso3) => {
    dispatch(setLoading(true));
    dispatch(setError(null));
    try {
      let res;

      if (inputMethod === 'text') {
        res = await classifyByText({
          description: productDescription,
          clarificationAnswers,
          exporterCountry: exporterIso3,
          importerCountry: importerIso3,
          language,
        });
      } else if (inputMethod === 'image') {
        res = await classifyByImage({
          imageUrl,
          exporterCountry: exporterIso3,
          importerCountry: importerIso3,
          language,
        });
      } else {
        // ocr
        res = await classifyByOCR({
          description: productDescription,
          imageUrl,
          exporterCountry: exporterIso3,
          importerCountry: importerIso3,
          language,
        });
      }

      // Enriquecer el result con los países seleccionados para el ResultsPanel
      const enrichedResult = {
        ...res.data.data,
        exporterCountry: exporterIso3,
        importerCountry: importerIso3,
      };
      dispatch(setResult(enrichedResult)); // también avanza step → 6
    } catch (err) {
      handleApiError(err);
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch, inputMethod, productDescription, clarificationAnswers, imageUrl, language, handleApiError]);

  // ── Reset completo del flujo ─────────────────────────────────────────────────
  const reset = useCallback(() => {
    setTextDescription('');
    setQuestions([]);
    setClarificationAnswers([]);
    setProductDescription('');
    setImageUrl(null);
    dispatch(resetClassifier());
  }, [dispatch]);

  const goToStep = useCallback((s) => dispatch(setStep(s)), [dispatch]);

  return {
    // Estado Redux
    step, inputMethod, result, loading, error, upgradeError,
    // Estado local
    textDescription, questions, clarificationAnswers, productDescription, imageUrl,
    // Setters locales (para edición en Paso 4)
    setProductDescription,
    // Handlers
    selectMethod,
    handleTextAnalyze,
    handleQuestionsComplete,
    handleDocumentAnalyzed,
    handleDescriptionConfirmed,
    handleFinalSubmit,
    reset,
    goToStep,
  };
}
