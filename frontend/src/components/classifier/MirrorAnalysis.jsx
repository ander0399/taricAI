import { motion } from 'framer-motion';
import {
  AlertOctagon, CheckCircle2, AlertTriangle, Shield, ArrowRight,
} from 'lucide-react';
import TaxComparisonTable from './TaxComparisonTable';
import NTBComparison from './NTBComparison';
import RiskProgressBar from './RiskProgressBar';

const RISK_CONFIG = {
  none:     { label: 'Sin riesgo',    cls: 'bg-emerald-600/20 text-emerald-400' },
  low:      { label: 'Riesgo bajo',   cls: 'bg-emerald-600/20 text-emerald-400' },
  medium:   { label: 'Riesgo medio',  cls: 'bg-yellow-600/20 text-yellow-400'   },
  high:     { label: 'Riesgo alto',   cls: 'bg-red-600/20 text-red-400'         },
  critical: { label: 'Riesgo crítico',cls: 'bg-red-900/30 text-red-300 border border-red-500/30' },
};

const URGENCY_LABEL = { pre_shipment: 'Pre-embarque', post_shipment: 'Post-embarque' };

const AlertTypeIcon = ({ type }) => {
  const icons = { sanitary: '🧫', quota: '📊', license: '📋', prohibition: '🚫', antidumping: '⚖️', dual_use: '🔒', embargo: '🚢', certification: '📜' };
  return <span className="text-base">{icons[type] || '⚠️'}</span>;
};

const cardEnter = (delay = 0) => ({
  hidden:  { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { delay } },
});

/**
 * @description Sección B del ResultsPanel — análisis espejo exportador vs. importador.
 * Soporta formato v2.2 (nuevo: executiveSummary, taxComparison, ntbComparison, etc.)
 * y formato legacy (concordance, exporterSubheading, etc.) para retrocompatibilidad.
 *
 * Orden de renderizado v2.2 (Sección 9.2):
 *   1. Resumen ejecutivo
 *   2. Comparación de subpartidas
 *   3. Acuerdos comerciales
 *   4. Comparación de tributos espejo
 *   5. Comparación de documentos espejo
 *   6. Comparación de NTBs
 *   7. Evaluación de riesgo
 *   8. Subpartida recomendada
 *
 * @param {{ mirrorAnalysis: object, resultJson: object|null, exporterCountry: string, importerCountry: string, exporterCountryName: string, importerCountryName: string, version: 'v2.2'|'legacy' }} props
 */
export default function MirrorAnalysis({
  mirrorAnalysis, resultJson,
  exporterCountry, importerCountry,
  exporterCountryName, importerCountryName,
  version = 'legacy',
}) {
  if (!mirrorAnalysis) return null;

  const isV2 = version === 'v2.2';

  // ── v2.2 destructuring ────────────────────────────────────────────────────
  const {
    executiveSummary,
    subheadingComparison,
    taxComparison,
    documentComparison,
    ntbComparison,
    riskAssessment:     riskV2,
    rulesOfOrigin:      rulesV2,
    recommendedSubheading: recV2,
  } = isV2 ? mirrorAnalysis : {};

  // ── legacy destructuring ──────────────────────────────────────────────────
  const {
    concordance, exporterSubheading, importerSubheading,
    divergences = [], riskAssessment, rulesOfOrigin,
    recommendedSubheading, criticalAlerts = [],
  } = !isV2 ? mirrorAnalysis : {};

  // Risk level (v2.2 usa overallLevel, legacy usa level)
  const riskLevelKey = isV2 ? riskV2?.overallLevel : riskAssessment?.level;
  const riskCfg      = RISK_CONFIG[riskLevelKey] || RISK_CONFIG.low;

  // Acuerdos comerciales — v2.2 lee de resultJson.tradeAgreements
  const agreements = isV2 ? resultJson?.tradeAgreements : rulesOfOrigin;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
      className="bg-slate-800/80 border border-blue-500/40 rounded-2xl p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-400" />
          Análisis Espejo
        </h3>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${riskCfg.cls}`}>
          {riskCfg.label}
        </span>
      </div>

      {/* ── 1. Resumen ejecutivo (v2.2 only) ─────────────────────────────────── */}
      {isV2 && executiveSummary && (
        <motion.div variants={cardEnter(0)} className="bg-slate-800 border border-blue-500/30 rounded-2xl p-6 shadow-lg shadow-blue-500/5">
          <p className="text-sm text-slate-300 leading-relaxed">{executiveSummary}</p>
        </motion.div>
      )}

      {/* ── 2. Comparación de subpartidas ─────────────────────────────────────── */}
      <motion.div variants={cardEnter(0.05)} className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left text-xs text-slate-400 uppercase font-semibold pb-2 pr-4 w-1/3" />
              <th className="text-left text-xs text-slate-400 uppercase font-semibold pb-2 pr-4">
                {exporterCountryName || exporterCountry}{' '}
                <span className="normal-case font-normal">(Exportador)</span>
              </th>
              <th className="text-left text-xs text-slate-400 uppercase font-semibold pb-2">
                {importerCountryName || importerCountry}{' '}
                <span className="normal-case font-normal">(Importador)</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            <tr>
              <td className="py-3 pr-4 text-slate-400 font-medium">Subpartida nacional</td>
              <td className="py-3 pr-4 font-mono text-blue-300 font-semibold">
                {isV2 ? (subheadingComparison?.exporterCode || '—') : (exporterSubheading?.code || '—')}
              </td>
              <td className="py-3 font-mono text-blue-300 font-semibold">
                {isV2 ? (subheadingComparison?.importerCode || '—') : (importerSubheading?.code || '—')}
              </td>
            </tr>
            <tr>
              <td className="py-3 pr-4 text-slate-400 font-medium">Descripción oficial</td>
              <td className="py-3 pr-4 text-slate-300 text-xs leading-relaxed">
                {isV2 ? (subheadingComparison?.exporterNomenclatureNotes || '—') : (exporterSubheading?.officialDescription || '—')}
              </td>
              <td className="py-3 text-slate-300 text-xs leading-relaxed">
                {isV2 ? (subheadingComparison?.importerNomenclatureNotes || '—') : (importerSubheading?.officialDescription || '—')}
              </td>
            </tr>
            {!isV2 && (
              <tr>
                <td className="py-3 pr-4 text-slate-400 font-medium">Fuente consultada</td>
                <td className="py-3 pr-4 text-slate-400 text-xs">{exporterSubheading?.source || '—'}</td>
                <td className="py-3 text-slate-400 text-xs">{importerSubheading?.source || '—'}</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Concordancia */}
        {isV2 && subheadingComparison && (
          <div className="mt-3 space-y-1.5">
            <div className="flex items-center gap-2">
              {subheadingComparison.match
                ? <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                : <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />}
              <span className="text-sm text-slate-300">{subheadingComparison.discrepancyExplanation}</span>
            </div>
            {subheadingComparison.reclassificationRisk && (
              <p className="text-xs text-slate-500 pl-6">Riesgo de reclasificación: {subheadingComparison.reclassificationRisk}</p>
            )}
          </div>
        )}

        {/* Legacy concordancia */}
        {!isV2 && (
          <div className="mt-3 flex items-center gap-2">
            {concordance?.match
              ? <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              : <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />}
            <span className="text-sm text-slate-300">
              {concordance?.match
                ? 'Las subpartidas nacionales coinciden — clasificación coherente.'
                : 'Se detectaron divergencias entre las nomenclaturas nacionales.'}
            </span>
          </div>
        )}
      </motion.div>

      {/* Legacy divergencias */}
      {!isV2 && divergences.length > 0 && (
        <motion.div variants={cardEnter(0.08)} className="space-y-1.5">
          <p className="text-xs font-semibold text-slate-400 uppercase">Divergencias detectadas</p>
          {divergences.map((d, i) => (
            <div key={i} className="flex items-start gap-2 bg-yellow-900/10 border border-yellow-500/20 rounded-lg px-3 py-2">
              <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 mt-0.5 flex-shrink-0" />
              <p className="text-yellow-300 text-xs leading-relaxed">{d}</p>
            </div>
          ))}
        </motion.div>
      )}

      {/* ── 3. Acuerdos comerciales ───────────────────────────────────────────── */}
      <motion.div variants={cardEnter(0.10)} className="space-y-1.5">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Acuerdos comerciales</p>
        <div className="flex flex-wrap gap-2 items-center">
          {(isV2 ? agreements?.hasPreferentialAgreement : rulesOfOrigin?.agreementApplies)
            ? (
              <span className="bg-emerald-600/20 text-emerald-400 text-xs font-semibold px-3 py-1 rounded-full">
                ✅ Acuerdo activo: {agreements?.agreementName || rulesOfOrigin?.agreementName}
              </span>
            ) : (
              <span className="bg-red-600/20 text-red-400 text-xs font-semibold px-3 py-1 rounded-full">
                ❌ Sin acuerdo preferencial {exporterCountry}–{importerCountry}
              </span>
            )
          }
          {/* Advertencia si la IA reportó un acuerdo no verificado */}
          {agreements?._unverified && (
            <span className="bg-yellow-600/20 text-yellow-400 border border-yellow-500/30 text-xs px-2 py-0.5 rounded-full">
              ⚠️ Verificar en fuente oficial
            </span>
          )}
        </div>
        {agreements?.validationNote && (
          <p className="text-xs text-slate-500 leading-relaxed">{agreements.validationNote}</p>
        )}
        {isV2 && agreements?.hasPreferentialAgreement && agreements?.preferentialRate && (
          <p className="text-sm text-slate-400">
            Tasa preferencial: <span className="text-emerald-400 font-semibold">{agreements.preferentialRate}</span>
          </p>
        )}
        {/* Legacy preferred rate */}
        {!isV2 && rulesOfOrigin?.agreementApplies && (
          <p className="text-sm text-slate-400">
            Tasa preferencial: <span className="text-emerald-400 font-semibold">{rulesOfOrigin.preferentialRate}</span>
          </p>
        )}
      </motion.div>

      {/* ── 4. Comparación de tributos espejo (v2.2) ─────────────────────────── */}
      {isV2 && taxComparison && (
        <motion.div variants={cardEnter(0.15)}>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Comparación de tributos espejo</p>
          <TaxComparisonTable
            taxComparison={taxComparison}
            exporterCountryName={exporterCountryName || exporterCountry}
            importerCountryName={importerCountryName || importerCountry}
          />
        </motion.div>
      )}

      {/* ── 5. Comparación de documentos espejo (v2.2) ───────────────────────── */}
      {isV2 && documentComparison && (
        <motion.div variants={cardEnter(0.20)} className="space-y-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Comparación de documentos espejo</p>
          {documentComparison.criticalMissing?.length > 0 && (
            <div className="bg-yellow-600/10 border border-yellow-500/30 rounded-xl p-4">
              <p className="text-sm font-semibold text-yellow-400 mb-2">⚠️ Documentos frecuentemente olvidados:</p>
              <ul className="space-y-1">
                {documentComparison.criticalMissing.map((item, i) => (
                  <li key={i} className="text-yellow-300 text-sm flex items-start gap-2">
                    <span className="mt-0.5">•</span>
                    <span>{typeof item === 'string' ? item : item.document}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      )}

      {/* ── 6. Barreras no arancelarias — NTBs (v2.2) ───────────────────────── */}
      {isV2 && ntbComparison && (
        <motion.div variants={cardEnter(0.25)}>
          <NTBComparison
            ntbComparison={ntbComparison}
            exporterCountryName={exporterCountryName || exporterCountry}
            importerCountryName={importerCountryName || importerCountry}
          />
        </motion.div>
      )}

      {/* ── 7. Evaluación de riesgo ───────────────────────────────────────────── */}
      {(isV2 ? riskV2 : riskAssessment) && (
        <motion.div variants={cardEnter(0.30)} className="bg-slate-900/50 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-sm font-semibold text-white">Evaluación de riesgo aduanero</p>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${riskCfg.cls}`}>
              {riskCfg.label}
            </span>
          </div>

          <RiskProgressBar
            level={riskLevelKey}
            probability={isV2 ? riskV2?.probability : riskAssessment?.probability}
          />

          {/* v2.2 — factores de riesgo */}
          {isV2 && riskV2?.riskFactors?.length > 0 && (
            <div className="space-y-1.5 pt-1">
              {riskV2.riskFactors.map((factor, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                    factor.severity === 'high' ? 'bg-red-400' : factor.severity === 'medium' ? 'bg-yellow-400' : 'bg-emerald-400'
                  }`} />
                  <div>
                    <p className="text-slate-300 text-xs font-medium">{factor.factor}</p>
                    {factor.mitigation && (
                      <p className="text-slate-500 text-xs leading-relaxed">{factor.mitigation}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Legacy — explicación */}
          {!isV2 && riskAssessment?.explanation && (
            <p className="text-slate-300 text-sm leading-relaxed">{riskAssessment.explanation}</p>
          )}

          {/* Alertas críticas */}
          {(() => {
            const alerts = isV2 ? (riskV2?.criticalAlerts || []) : criticalAlerts;
            return alerts.length > 0 ? (
              <div className="space-y-2 pt-1">
                {alerts.map((alert, i) => (
                  <div key={i} className="flex items-start gap-3 bg-red-900/20 border border-red-500/30 rounded-xl px-4 py-3">
                    <AlertOctagon className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <AlertTypeIcon type={alert.type} />
                        <span className="text-xs font-semibold text-red-300 uppercase">{alert.type?.replace('_', ' ')}</span>
                        <span className="text-xs text-slate-500">· {URGENCY_LABEL[alert.urgency] || alert.urgency}</span>
                      </div>
                      <p className="text-red-300 text-sm leading-relaxed">{alert.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : null;
          })()}
        </motion.div>
      )}

      {/* ── 8. Subpartida recomendada ─────────────────────────────────────────── */}
      {(isV2 ? recV2 : recommendedSubheading)?.code && (
        <motion.div variants={cardEnter(0.35)} className="bg-emerald-900/10 border border-emerald-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <ArrowRight className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-semibold text-slate-300">Subpartida recomendada para declarar</span>
          </div>
          <p className="font-mono text-emerald-400 font-bold text-lg">
            {isV2 ? recV2.code : recommendedSubheading.code}
          </p>
          <p className="text-slate-400 text-xs mt-1 leading-relaxed">
            {isV2 ? recV2.justification : recommendedSubheading.rationale}
          </p>
          {isV2 && recV2.officialSource && (
            <p className="text-slate-500 text-xs mt-1">Fuente: {recV2.officialSource}</p>
          )}
          {/* Códigos alternativos v2.2 */}
          {isV2 && recV2.alternativeCodes?.length > 0 && (
            <div className="mt-2 space-y-1">
              <p className="text-xs text-slate-500 font-semibold">Códigos alternativos:</p>
              {recV2.alternativeCodes.map((alt, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-slate-500">
                  <span className="font-mono text-slate-400">{alt.code}</span>
                  <span>— {alt.reason}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Legacy reglas de origen */}
      {!isV2 && rulesOfOrigin && (
        <motion.div variants={cardEnter(0.4)} className="space-y-1.5">
          <p className="text-xs font-semibold text-slate-400 uppercase">Reglas de origen</p>
          {rulesOfOrigin.transformationRequired && (
            <p className="text-slate-400 text-xs">Transformación requerida: {rulesOfOrigin.transformationRequired}</p>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
