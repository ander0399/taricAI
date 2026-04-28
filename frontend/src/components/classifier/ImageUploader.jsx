import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, XCircle, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import api from '../../services/api';

const MAX_SIZE_MB = 20;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

const LOADING_STAGES = [
  { label: 'Procesando imagen en alta resolución...', progress: 10 },
  { label: 'Identificando materiales, función y uso...', progress: 35 },
  { label: 'Generando descripción comercial aduanera...', progress: 65 },
  { label: 'Determinando código HS internacional...', progress: 88 },
];

const TIPS = [
  '📌 Fondo neutro o blanco: mejora la identificación de materiales',
  '📌 Iluminación uniforme: evita sombras que oculten detalles',
  '📌 Ángulo frontal + lateral si es posible: mayor precisión arancelaria',
  '📌 Incluye etiqueta o packaging si lo tiene: identifica composición y uso',
];

/**
 * @description Paso 2B del flujo clasificador — dropzone de imagen con análisis gpt-4o Vision.
 * Etapa 1: sube el archivo al backend → Cloudinary → gpt-4o → retorna descripción del producto.
 * Etapa 2 (clasificación completa con países) se dispara desde CountrySelector en Paso 5.
 *
 * @param {{ onAnalyzed: Function, language?: string }} props
 *   onAnalyzed({ step, imageUrl, productDescription, primaryHsCode, ... }) — llamado al completar Etapa 1
 */
export default function ImageUploader({ onAnalyzed, language = 'es' }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);
  const stageTimerRef = useRef(null);

  const validateAndSet = useCallback((selectedFile) => {
    setError(null);
    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      setError('Formato no válido. Usa PNG, JPG, WEBP o HEIC.');
      return;
    }
    if (selectedFile.size > MAX_SIZE_BYTES) {
      setError(`El archivo supera el límite de ${MAX_SIZE_MB} MB.`);
      return;
    }
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) validateAndSet(dropped);
  }, [validateAndSet]);

  const handleChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) validateAndSet(selected);
  };

  const handleRemove = () => {
    setFile(null);
    setPreview(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const startStageTimer = () => {
    let idx = 0;
    setStageIndex(0);
    setProgress(LOADING_STAGES[0].progress);

    stageTimerRef.current = setInterval(() => {
      idx += 1;
      if (idx < LOADING_STAGES.length) {
        setStageIndex(idx);
        setProgress(LOADING_STAGES[idx].progress);
      } else {
        clearInterval(stageTimerRef.current);
      }
    }, 2200);
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setError(null);
    setLoading(true);
    startStageTimer();

    try {
      const formData = new FormData();
      formData.append('image', file);
      if (language) formData.append('language', language);

      const response = await api.post('/classifier/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      clearInterval(stageTimerRef.current);
      setProgress(100);

      // Pequeña pausa para que la barra llegue a 100% antes de avanzar
      setTimeout(() => {
        setLoading(false);
        onAnalyzed(response.data.data);
      }, 400);
    } catch (err) {
      clearInterval(stageTimerRef.current);
      setLoading(false);
      setProgress(0);
      const msg = err.response?.data?.message || 'Error al analizar la imagen. Intenta de nuevo.';
      setError(msg);
    }
  };

  const formatSize = (bytes) => {
    const mb = bytes / (1024 * 1024);
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">

      {/* Dropzone */}
      {!file ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200
            ${isDragging
              ? 'border-blue-400 bg-blue-500/10'
              : 'border-blue-400/50 bg-slate-800/30 hover:border-blue-400/80 hover:bg-slate-800/50'
            }`}
        >
          <Camera className="w-12 h-12 text-blue-400 mx-auto mb-4" />
          <p className="text-white font-medium mb-1">Arrastra tu imagen aquí o haz clic para seleccionar</p>
          <p className="text-slate-400 text-sm">PNG, JPG, WEBP, HEIC — Máx. {MAX_SIZE_MB} MB</p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleChange}
          />
        </div>
      ) : (
        /* Preview */
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 flex items-center gap-4">
          <img
            src={preview}
            alt="preview"
            className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{file.name}</p>
            <p className="text-slate-400 text-xs mt-0.5">{formatSize(file.size)}</p>
          </div>
          <button
            onClick={handleRemove}
            className="text-slate-400 hover:text-red-400 transition flex-shrink-0"
            aria-label="Eliminar imagen"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 bg-red-900/20 border border-red-500/30 rounded-xl px-4 py-3"
          >
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <p className="text-red-300 text-sm">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tips card — colapsable */}
      <div className="bg-blue-950/30 border border-blue-500/20 rounded-xl overflow-hidden">
        <button
          onClick={() => setShowTips((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm text-slate-300 hover:text-white transition"
        >
          <span>💡 Consejos para mejores resultados</span>
          {showTips ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        <AnimatePresence>
          {showTips && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <ul className="px-4 pb-4 space-y-1.5">
                {TIPS.map((tip, i) => (
                  <li key={i} className="text-slate-400 text-sm">{tip}</li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Loading — barra de progreso + etapas */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            <div className="bg-slate-700 rounded-full h-2 overflow-hidden">
              <motion.div
                className="bg-blue-600 rounded-full h-2"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.6, ease: 'easeInOut' }}
              />
            </div>
            <motion.p
              key={stageIndex}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-slate-400 text-sm text-center"
            >
              {LOADING_STAGES[stageIndex]?.label}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botón analizar */}
      <button
        onClick={handleAnalyze}
        disabled={!file || loading}
        className={`w-full rounded-lg py-3 font-bold text-white transition
          ${file && !loading
            ? 'bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20'
            : 'bg-slate-700 opacity-50 cursor-not-allowed'
          }`}
      >
        {loading ? 'Analizando...' : '🔍 Analizar con GPT-4o'}
      </button>
    </div>
  );
}
