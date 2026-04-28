import { useState, useCallback } from 'react';

const MAX_BYTES = 20 * 1024 * 1024; // 20 MB
const ALLOWED  = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

/**
 * @description Hook para gestionar la selección, validación y preview de imagen.
 * Reutilizado por ImageUploader.jsx; también expuesto para uso directo en ClassifierLayout.
 * @returns {{ file, preview, error, setFile, clearFile, validateAndSet }}
 */
export function useImageUpload() {
  const [file,    setFileState] = useState(null);
  const [preview, setPreview]   = useState(null);
  const [error,   setError]     = useState(null);

  const clearFile = useCallback(() => {
    if (preview) URL.revokeObjectURL(preview);
    setFileState(null);
    setPreview(null);
    setError(null);
  }, [preview]);

  const validateAndSet = useCallback((selectedFile) => {
    setError(null);
    if (!ALLOWED.includes(selectedFile.type)) {
      setError('Formato no válido. Usa PNG, JPG, WEBP o HEIC.');
      return false;
    }
    if (selectedFile.size > MAX_BYTES) {
      setError('El archivo supera el límite de 20 MB.');
      return false;
    }
    if (preview) URL.revokeObjectURL(preview);
    setFileState(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    return true;
  }, [preview]);

  const setFile = useCallback((f) => {
    if (f) validateAndSet(f);
    else clearFile();
  }, [validateAndSet, clearFile]);

  return { file, preview, error, setFile, clearFile, validateAndSet };
}
