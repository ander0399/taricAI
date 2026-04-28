import api from './api';

// ── Clasificación ─────────────────────────────────────────────────────────────

/** Primera llamada: description sin países → preguntas de clarificación */
export const getClassificationQuestions = (description, language = 'es') =>
  api.post('/classifier/text', { description, clarificationAnswers: [], language });

/** Segunda llamada de texto: description + respuestas + países → resultado completo */
export const classifyByText = ({ description, clarificationAnswers, exporterCountry, importerCountry, language = 'es' }) =>
  api.post('/classifier/text', { description, clarificationAnswers, exporterCountry, importerCountry, language });

/** Etapa 1 imagen: multipart → análisis gpt-4o → { step: 'analyzed', imageUrl, productDescription, ... } */
export const analyzeImage = (formData) =>
  api.post('/classifier/image', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

/** Etapa 2 imagen: JSON con imageUrl + países → clasificación completa */
export const classifyByImage = ({ imageUrl, exporterCountry, importerCountry, language = 'es' }) =>
  api.post('/classifier/image', { imageUrl, exporterCountry, importerCountry, language });

/** Etapa 1 OCR: multipart (PDF o imagen) → descripción extraída */
export const analyzeOCR = (formData) =>
  api.post('/classifier/ocr', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

/** Etapa 2 OCR: descripción confirmada + países → clasificación completa */
export const classifyByOCR = ({ description, imageUrl, exporterCountry, importerCountry, language = 'es' }) =>
  api.post('/classifier/ocr', { description, imageUrl, exporterCountry, importerCountry, language });

// ── Historial ─────────────────────────────────────────────────────────────────

export const fetchHistory = (page = 1, limit = 15) =>
  api.get(`/classifier/history?page=${page}&limit=${limit}`);

export const fetchHistoryDetail = (id) =>
  api.get(`/classifier/history/${id}`);

/** Descarga el PDF de una clasificación (responseType: blob para manejar el binario) */
export const downloadPDF = (id) =>
  api.get(`/classifier/export/${id}`, { responseType: 'blob' });

// ── Países ────────────────────────────────────────────────────────────────────

export const fetchCountries = () => api.get('/classifier/countries');
