import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RotateCcw, PlusCircle, ChevronDown, ChevronUp,
  AlertTriangle, Shield, ExternalLink, Loader2, FileDown,
} from 'lucide-react';
import MirrorAnalysis from './MirrorAnalysis';
import TariffCard from './TariffCard';
import DocumentsChecklist from './DocumentsChecklist';
import CostBreakdown from './CostBreakdown';
import { downloadPDF } from '../../services/classifier.api';
import { detectVersion, getRiskLevel, getCriticalAlerts } from '../../utils/classification.compat';

const CONFIDENCE_COLOR = (pct) => {
  if (pct >= 80) return 'bg-emerald-500';
  if (pct >= 60) return 'bg-yellow-500';
  return 'bg-red-500';
};

const RISK_BADGE = {
  low:      'bg-emerald-600/20 text-emerald-400',
  medium:   'bg-yellow-600/20 text-yellow-400',
  high:     'bg-red-600/20 text-red-400',
  critical: 'bg-red-900/30 text-red-300',
};

const RISK_LABEL = {
  low: 'Riesgo bajo', medium: 'Riesgo medio', high: 'Riesgo alto', critical: 'Riesgo crítico',
};

/**
 * @description Paso 6 del flujo clasificador — panel completo con todos los resultados.
 * Soporta resultJson formato legacy y v2.2 mediante classification.compat.js.
 * Muestra: resumen ejecutivo, análisis espejo (Pro+), aranceles, documentos,
 * regulaciones, costos, alertas y fuentes consultadas.
 *
 * @param {{ result: object, exporterCountry: string, importerCountry: string, plan: string, onNewClassification: Function, onReclassify: Function }} props
 */
export default function ResultsPanel({ result, exporterCountry, importerCountry, plan, onNewClassification, onReclassify }) {
  const [showSources, setShowSources] = useState(false);
  const [pdfLoading, setPdfLoading]   = useState(false);
  const [pdfMsg, setPdfMsg]           = useState(null);

  if (!result || result.step !== 'completed') return null;

  const {
    hsCode, hsDescription, confidence,
    productDescription, alternativeCodes = [],
    mirrorAnalysis, sourcesConsulted = 0,
    classificationId,
    resultJson,
  } = result;

  // Retrocompatibilidad: detectar versión y extraer campos
  const version    = detectVersion(resultJson);
  const isPro      = ['pro', 'team', 'enterprise'].includes(plan);
  const riskLevel  = getRiskLevel(mirrorAnalysis, version);
  const critAlerts = getCriticalAlerts(mirrorAnalysis, version);

  // Subpartidas: preferir v2.2, fallback a legacy
  const hsCodeOrigin = version === 'v2.2'
    ? resultJson?.exporter?.nationalSubheading
    : result.hsCodeOrigin;
  const hsCodeDest = version === 'v2.2'
    ? resultJson?.importer?.nationalSubheading
    : result.hsCodeDest;

  // Nombres de países para los componentes hijos
  const exporterName = version === 'v2.2'
    ? (resultJson?.exporter?.countryName || exporterCountry)
    : exporterCountry;
  const importerName = version === 'v2.2'
    ? (resultJson?.importer?.countryName || importerCountry)
    : importerCountry;

  // Regulaciones especiales (solo legacy tariffData.specialRegulations)
  const specialRegulations = version === 'v2.2'
    ? []
    : (result.tariffData?.specialRegulations || []);

  // tariffData para componentes legacy (TariffCard usa esto)
  const tariffData = version === 'v2.2' ? null : result.tariffData;

  const handleExportPDF = async () => {
    if (!classificationId || pdfLoading) return;
    setPdfLoading(true);
    setPdfMsg(null);
    try {
      const response = await downloadPDF(classificationId);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `taricai-${hsCode || 'clasificacion'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setPdfMsg({ type: 'success', text: 'PDF descargado correctamente' });
    } catch {
      setPdfMsg({ type: 'error', text: 'No se pudo generar el PDF. Intenta de nuevo.' });
    } finally {
      setPdfLoading(false);
      setTimeout(() => setPdfMsg(null), 4000);
    }
  };

  const containerVariants = {
    hidden:  {},
    visible: { transition: { staggerChildren: 0.07 } },
  };
  const cardEnter = (delay = 0) => ({
    hidden:  { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { delay } },
  });

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="bg-slate-900 min-h-screen px-4 py-8"
    >
      <div className="max-w-5xl mx-auto space-y-6">

        {/* ── A. Resumen Ejecutivo ────────────────────────────────── */}
        <motion.div variants={cardEnter(0)} className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <div>
              <p className="text-slate-400 text-sm mb-1">{productDescription || resultJson?.product?.description}</p>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <span className="font-mono bg-blue-600/20 text-blue-300 px-4 py-2 rounded-lg text-2xl font-bold tracking-widest">
                  {hsCode || resultJson?.product?.hsCodeInternational || '------'}
                </span>
                <p className="text-slate-300 text-sm max-w-sm">
                  {hsDescription || resultJson?.product?.hsDescriptionInternational}
                </p>
              </div>
            </div>
            {riskLevel && (
              <span className={`text-sm font-semibold px-3 py-1.5 rounded-full ${RISK_BADGE[riskLevel] || RISK_BADGE.low}`}>
                {RISK_LABEL[riskLevel] || riskLevel}
              </span>
            )}
          </div>

          {/* Subpartidas nacionales */}
          {(hsCodeOrigin || hsCodeDest) && (
            <div className="flex flex-wrap gap-4 mb-4">
              {hsCodeOrigin && (
                <div className="bg-slate-900/60 rounded-lg px-4 py-2">
                  <p className="text-xs text-slate-500 mb-0.5">Subpartida {exporterName}</p>
                  <p className="font-mono text-blue-300 font-semibold">{hsCodeOrigin}</p>
                </div>
              )}
              {hsCodeDest && (
                <div className="bg-slate-900/60 rounded-lg px-4 py-2">
                  <p className="text-xs text-slate-500 mb-0.5">Subpartida {importerName}</p>
                  <p className="font-mono text-blue-300 font-semibold">{hsCodeDest}</p>
                </div>
              )}
            </div>
          )}

          {/* Confidence bar — solo Pro+ */}
          {isPro && confidence !== null && confidence !== undefined && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Confianza arancelaria</span>
                <span className="text-white font-semibold">{confidence}%</span>
              </div>
              <div className="bg-slate-700 rounded-full h-3 overflow-hidden">
                <motion.div
                  className={`h-3 rounded-full ${CONFIDENCE_COLOR(confidence)}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${confidence}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
                />
              </div>
            </div>
          )}

          {/* Códigos alternativos */}
          {alternativeCodes.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-700">
              <p className="text-xs text-slate-500 mb-2">Códigos alternativos considerados</p>
              <div className="flex flex-wrap gap-2">
                {alternativeCodes.map((alt, i) => (
                  <div key={i} className="bg-slate-700/50 rounded-lg px-3 py-1.5 flex items-center gap-2">
                    <span className="font-mono text-slate-300 text-sm">{alt.hsCode}</span>
                    <span className="text-slate-500 text-xs">{alt.probability}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* ── B. Análisis Espejo (Pro+) — v2.2 y legacy ──────────── */}
        {isPro && mirrorAnalysis && (
          <motion.div variants={cardEnter(0.05)}>
            <MirrorAnalysis
              mirrorAnalysis={mirrorAnalysis}
              resultJson={resultJson}
              exporterCountry={exporterCountry}
              importerCountry={importerCountry}
              exporterCountryName={exporterName}
              importerCountryName={importerName}
              version={version}
            />
          </motion.div>
        )}

        {/* ── C + D. Acuerdos y Aranceles ────────────────────────── */}
        {/* v2.2 Pro+: lo muestra MirrorAnalysis (secciones 3 y 4). Para Free o legacy: TariffCard */}
        {!(version === 'v2.2' && isPro && mirrorAnalysis) && (tariffData || resultJson) && (
          <motion.div variants={cardEnter(0.1)}>
            <TariffCard
              resultJson={resultJson}
              tariffData={tariffData}
              exporterCountry={exporterCountry}
              importerCountry={importerCountry}
            />
          </motion.div>
        )}

        {/* ── E. Documentos Requeridos ────────────────────────────── */}
        <motion.div variants={cardEnter(0.15)}>
          <DocumentsChecklist
            resultJson={resultJson}
            mirrorAnalysis={mirrorAnalysis}
            exporterCountryName={exporterName}
            importerCountryName={importerName}
          />
        </motion.div>

        {/* ── F. Regulaciones Especiales (Pro+ legacy) ───────────── */}
        {isPro && specialRegulations.length > 0 && (
          <motion.div variants={cardEnter(0.2)} className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-400" />
              Regulaciones Especiales
            </h3>
            <ul className="space-y-2">
              {specialRegulations.map((reg, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <Shield className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-300 text-sm leading-relaxed">{typeof reg === 'string' ? reg : reg.description}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* ── G. Desglose de Costos ───────────────────────────────── */}
        <motion.div variants={cardEnter(0.2)}>
          <CostBreakdown resultJson={resultJson} />
        </motion.div>

        {/* ── H. Alertas críticas ─────────────────────────────────── */}
        {critAlerts.length > 0 && (
          <motion.div
            variants={cardEnter(0.25)}
            className="bg-yellow-900/20 border border-yellow-500/20 rounded-xl p-4 space-y-2"
          >
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              <h3 className="text-base font-semibold text-white">Alertas Críticas</h3>
            </div>
            <ul className="space-y-1.5">
              {critAlerts.map((alert, i) => (
                <li key={i} className="text-yellow-300 text-sm flex items-start gap-2">
                  <span className="mt-0.5">⚠️</span>
                  <span>{alert.description}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* ── Fuentes consultadas (colapsable) ────────────────────── */}
        <motion.div variants={cardEnter(0.3)} className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
          <button
            onClick={() => setShowSources((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-3.5 text-sm text-slate-400 hover:text-white transition"
          >
            <div className="flex items-center gap-2">
              <ExternalLink className="w-4 h-4" />
              <span>Fuentes oficiales consultadas</span>
              <span className="bg-slate-700 text-slate-400 text-xs px-2 py-0.5 rounded-full">
                {resultJson?.meta?.sourcesConsultedCount || sourcesConsulted}
              </span>
            </div>
            {showSources ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <AnimatePresence>
            {showSources && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-4 space-y-1">
                  <p className="text-slate-500 text-sm">
                    Se consultaron {resultJson?.meta?.sourcesConsultedCount || sourcesConsulted} fuentes oficiales en paralelo.
                    {resultJson?.meta?.sourcesWithDataCount !== undefined && (
                      <span className="text-slate-600"> ({resultJson.meta.sourcesWithDataCount} con datos extraídos.)</span>
                    )}
                  </p>
                  {resultJson?.meta?.warning && (
                    <p className="text-yellow-400 text-xs">{resultJson.meta.warning}</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── Barra de acciones ───────────────────────────────────── */}
        <motion.div variants={cardEnter(0.35)} className="flex flex-wrap gap-3 pt-2 pb-8">
          <button
            onClick={onNewClassification}
            className="flex items-center gap-2 border border-white/30 text-white hover:bg-white/10 rounded-lg px-4 py-2 text-sm transition"
          >
            <PlusCircle className="w-4 h-4" />
            Nueva clasificación
          </button>
          <button
            onClick={onReclassify}
            className="flex items-center gap-2 bg-slate-800 border border-slate-600 hover:bg-slate-700 text-white rounded-lg px-4 py-2 text-sm transition"
          >
            <RotateCcw className="w-4 h-4" />
            Reclasificar
          </button>
          {isPro && (
            <button
              onClick={handleExportPDF}
              disabled={pdfLoading || !classificationId}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg px-4 py-2 text-sm font-medium transition"
            >
              {pdfLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
              {pdfLoading ? 'Generando PDF...' : 'Exportar PDF'}
            </button>
          )}
          <AnimatePresence>
            {pdfMsg && (
              <motion.span
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium ${
                  pdfMsg.type === 'success'
                    ? 'bg-emerald-600/20 border border-emerald-500/30 text-emerald-300'
                    : 'bg-red-600/20 border border-red-500/30 text-red-300'
                }`}
              >
                {pdfMsg.type === 'success' ? '✓' : '✗'} {pdfMsg.text}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>

      </div>
    </motion.div>
  );
}
