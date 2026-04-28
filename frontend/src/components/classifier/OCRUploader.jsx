import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import api from '../../services/api';

const MAX_SIZE_MB = 20;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif',
  'application/pdf',
];
const ALLOWED_EXTS = '.pdf, .png, .jpg, .jpeg, .webp, .heic';

/**
 * @description Paso 2C del flujo clasificador — OCR de facturas y fichas técnicas (solo Pro+).
 * Acepta PDF (texto o escaneado) e imágenes de documentos comerciales.
 *
 * Etapa 1: sube el archivo al backend → ocr.service.js lo analiza con pdf-parse o gpt-4o Vision
 *           → retorna descripción del producto extraída del documento.
 * Etapa 2 (clasificación completa con países) se dispara desde CountrySelector en Paso 5.
 *
 * @param {{ onAnalyzed: Function, language?: string }} props
 *   onAnalyzed({ step, imageUrl?, productDescription, primaryHsCode, ... }) — al completar Etapa 1
 */
export default function OCRUploader({ onAnalyzed, language = 'es' }) {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const validateAndSet = useCallback((selectedFile) => {
    setError(null);
    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      setError(`Formato no válido. Usa ${ALLOWED_EXTS}.`);
      return;
    }
    if (selectedFile.size > MAX_SIZE_BYTES) {
      setError(`El archivo supera el límite de ${MAX_SIZE_MB} MB.`);
      return;
    }
    setFile(selectedFile);
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
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('image', file); // El campo se llama 'image' en multer para ambos endpoints
      if (language) formData.append('language', language);

      const response = await api.post('/classifier/ocr', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setLoading(false);
      onAnalyzed(response.data.data);
    } catch (err) {
      setLoading(false);
      const msg = err.response?.data?.message || 'Error al procesar el documento. Intenta de nuevo.';
      setError(msg);
    }
  };

  const formatSize = (bytes) => {
    const mb = bytes / (1024 * 1024);
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
  };

  const isPDF = file?.type === 'application/pdf';

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">

      {/* Badge Pro */}
      <div className="flex items-center gap-2">
        <span className="bg-emerald-600/20 text-emerald-400 text-xs font-semibold px-3 py-1 rounded-full">
          Plan Pro
        </span>
        <span className="text-slate-400 text-sm">GPT-4o extrae y clasifica automáticamente</span>
      </div>

      {/* Dropzone */}
      {!file ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200
            ${isDragging
              ? 'border-emerald-400 bg-emerald-500/10'
              : 'border-emerald-400/50 bg-slate-800/30 hover:border-emerald-400/80 hover:bg-slate-800/50'
            }`}
        >
          <FileText className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
          <p className="text-white font-medium mb-1">Arrastra tu documento aquí o haz clic para seleccionar</p>
          <p className="text-slate-400 text-sm">Facturas, fichas técnicas, listas de empaque</p>
          <p className="text-slate-500 text-xs mt-1">PDF, PNG, JPG, WEBP — Máx. {MAX_SIZE_MB} MB</p>
          <input
            ref={inputRef}
            type="file"
            accept={ALLOWED_EXTS}
            className="hidden"
            onChange={handleChange}
          />
        </div>
      ) : (
        /* Preview del archivo seleccionado */
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 flex items-center gap-4">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${isPDF ? 'bg-red-900/30' : 'bg-emerald-900/30'}`}>
            <FileText className={`w-6 h-6 ${isPDF ? 'text-red-400' : 'text-emerald-400'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{file.name}</p>
            <p className="text-slate-400 text-xs mt-0.5">
              {isPDF ? '📄 PDF' : '🖼️ Imagen'} · {formatSize(file.size)}
            </p>
          </div>
          <button
            onClick={handleRemove}
            className="text-slate-400 hover:text-red-400 transition flex-shrink-0"
            aria-label="Eliminar documento"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Nota informativa sobre el proceso */}
      <div className="bg-emerald-950/30 border border-emerald-500/20 rounded-xl px-4 py-3 text-sm text-slate-400">
        {isPDF
          ? '📋 PDF detectado — se extraerá el texto primero. Si está escaneado, se usará GPT-4o Vision automáticamente.'
          : '📷 Imagen detectada — GPT-4o analizará el documento con alta resolución (detail: high).'
        }
      </div>

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

      {/* Loading */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center gap-3 py-2"
          >
            <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
            <span className="text-slate-400 text-sm">GPT-4o está extrayendo y clasificando el documento...</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botón analizar */}
      <button
        onClick={handleAnalyze}
        disabled={!file || loading}
        className={`w-full rounded-lg py-3 font-bold text-white transition
          ${file && !loading
            ? 'bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-500/20'
            : 'bg-slate-700 opacity-50 cursor-not-allowed'
          }`}
      >
        {loading ? 'Extrayendo información...' : '📄 Extraer y Clasificar con GPT-4o'}
      </button>
    </div>
  );
}
