import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RotateCcw, PlusCircle, ChevronDown, ChevronUp,
  AlertTriangle, Shield, ExternalLink, CheckCircle2,
} from 'lucide-react';
import MirrorAnalysis from './MirrorAnalysis';
import TariffCard from './TariffCard';
import DocumentsChecklist from './DocumentsChecklist';
import CostBreakdown from './CostBreakdown';

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

/**
 * @description Paso 6 del flujo clasificador — panel completo con todos los resultados.
 * Muestra: resumen ejecutivo, análisis espejo (Pro+), aranceles, documentos,
 * regulaciones, costos, alertas y fuentes consultadas.
 *
 * @param {{ result: object, exporterCountry: string, importerCountry: string, plan: string, onNewClassification: Function, onReclassify: Function }} props
 */
export default function ResultsPanel({ result, exporterCountry, importerCountry, plan, onNewClassification, onReclassify }) {
  const [showSources, setShowSources] = useState(false);

  if (!result || result.step !== 'completed') return null;

  const {
    hsCode, hsDescription, hsCodeOrigin, hsCodeDest,
    confidence, productDescription, alternativeCodes = [],
    tariffData, mirrorAnalysis, sourcesConsulted = 0,
    classificationId,
  } = result;

  const isPro = ['pro', 'team', 'enterprise'].includes(plan);
  const riskLevel = mirrorAnalysis?.riskAssessment?.level || null;
  const specialRegulations = tariffData?.specialRegulations || [];

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.07 } },
  };
  const itemVariants = {
    hidden:  { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="bg-slate-900 min-h-screen px-4 py-8"
    >
      <div className="max-w-5xl mx-auto space-y-6">

        {/* ── A. Resumen Ejecutivo ────────────────────────────────── */}
        <motion.div variants={itemVariants} className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <div>
              <p className="text-slate-400 text-sm mb-1">{productDescription}</p>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <span className="font-mono bg-blue-600/20 text-blue-300 px-4 py-2 rounded-lg text-2xl font-bold tracking-widest">
                  {hsCode || '------'}
                </span>
                <p className="text-slate-300 text-sm max-w-sm">{hsDescription}</p>
              </div>
            </div>
            {riskLevel && (
              <span className={`text-sm font-semibold px-3 py-1.5 rounded-full ${RISK_BADGE[riskLevel] || RISK_BADGE.low}`}>
                {riskLevel === 'low' && '🟢'} {riskLevel === 'medium' && '🟡'} {riskLevel === 'high' && '🔴'} {riskLevel === 'critical' && '🔴🔴'}
                {' '}Riesgo {riskLevel === 'low' ? 'bajo' : riskLevel === 'medium' ? 'medio' : riskLevel === 'critical' ? 'crítico' : 'alto'}
              </span>
            )}
          </div>

          {/* Subpartidas nacionales */}
          {(hsCodeOrigin || hsCodeDest) && (
            <div className="flex flex-wrap gap-4 mb-4">
              {hsCodeOrigin && (
                <div className="bg-slate-900/60 rounded-lg px-4 py-2">
                  <p className="text-xs text-slate-500 mb-0.5">Subpartida {exporterCountry}</p>
                  <p className="font-mono text-blue-300 font-semibold">{hsCodeOrigin}</p>
                </div>
              )}
              {hsCodeDest && (
                <div className="bg-slate-900/60 rounded-lg px-4 py-2">
                  <p className="text-xs text-slate-500 mb-0.5">Subpartida {importerCountry}</p>
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

        {/* ── B. Análisis Espejo (Pro+) ───────────────────────────── */}
        {isPro && mirrorAnalysis && (
          <motion.div variants={itemVariants}>
            <MirrorAnalysis
              mirrorAnalysis={mirrorAnalysis}
              exporterCountry={exporterCountry}
              importerCountry={importerCountry}
            />
          </motion.div>
        )}

        {/* ── C + D. Acuerdos y Aranceles ────────────────────────── */}
        <motion.div variants={itemVariants}>
          <TariffCard
            tariffData={tariffData}
            exporterCountry={exporterCountry}
            importerCountry={importerCountry}
          />
        </motion.div>

        {/* ── E. Documentos Requeridos ────────────────────────────── */}
        <motion.div variants={itemVariants}>
          <DocumentsChecklist tariffData={tariffData} />
        </motion.div>

        {/* ── F. Regulaciones Especiales (Pro+) ──────────────────── */}
        {isPro && specialRegulations.length > 0 && (
          <motion.div variants={itemVariants} className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
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
        <motion.div variants={itemVariants}>
          <CostBreakdown tariffData={tariffData} />
        </motion.div>

        {/* ── H. Alertas y Recomendaciones ───────────────────────── */}
        {tariffData?.specialRegulations?.length > 0 || mirrorAnalysis?.criticalAlerts?.length > 0 ? (
          <motion.div
            variants={itemVariants}
            className="bg-yellow-900/20 border border-yellow-500/20 rounded-xl p-4 space-y-2"
          >
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              <h3 className="text-base font-semibold text-white">Alertas y Recomendaciones</h3>
            </div>
            <ul className="space-y-1.5">
              {(mirrorAnalysis?.criticalAlerts || []).map((alert, i) => (
                <li key={i} className="text-yellow-300 text-sm flex items-start gap-2">
                  <span className="mt-0.5">⚠️</span>
                  <span>{alert.description}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        ) : null}

        {/* ── Fuentes consultadas (colapsable) ────────────────────── */}
        <motion.div variants={itemVariants} className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
          <button
            onClick={() => setShowSources(v => !v)}
            className="w-full flex items-center justify-between px-5 py-3.5 text-sm text-slate-400 hover:text-white transition"
          >
            <div className="flex items-center gap-2">
              <ExternalLink className="w-4 h-4" />
              <span>Fuentes oficiales consultadas</span>
              <span className="bg-slate-700 text-slate-400 text-xs px-2 py-0.5 rounded-full">{sourcesConsulted}</span>
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
                <p className="px-5 pb-4 text-slate-500 text-sm">
                  Se consultaron {sourcesConsulted} fuentes oficiales en paralelo. Los detalles de cada fuente
                  (URL, estado y timestamp) están disponibles en el historial de clasificaciones.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── Barra de acciones ───────────────────────────────────── */}
        <motion.div
          variants={itemVariants}
          className="flex flex-wrap gap-3 pt-2 pb-8"
        >
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
              onClick={() => alert('Export PDF — Fase 8')}
              className="flex items-center gap-2 border border-white/30 text-white hover:bg-white/10 rounded-lg px-4 py-2 text-sm transition"
            >
              📄 Exportar PDF
            </button>
          )}
        </motion.div>

      </div>
    </motion.div>
  );
}
