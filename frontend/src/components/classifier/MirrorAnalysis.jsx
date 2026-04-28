import { motion } from 'framer-motion';
import { AlertOctagon, CheckCircle2, AlertTriangle, Shield, ArrowRight } from 'lucide-react';

const RISK_CONFIG = {
  none:     { label: 'Sin riesgo',   cls: 'bg-emerald-600/20 text-emerald-400' },
  low:      { label: 'Riesgo bajo',  cls: 'bg-emerald-600/20 text-emerald-400' },
  medium:   { label: 'Riesgo medio', cls: 'bg-yellow-600/20 text-yellow-400'   },
  high:     { label: 'Riesgo alto',  cls: 'bg-red-600/20 text-red-400'         },
  critical: { label: 'Riesgo crítico', cls: 'bg-red-900/30 text-red-300 border border-red-500/30' },
};

const URGENCY_LABEL = { pre_shipment: 'Pre-embarque', post_shipment: 'Post-embarque' };

const AlertTypeIcon = ({ type }) => {
  const icons = { sanitary: '🧫', quota: '📊', license: '📋', prohibition: '🚫', antidumping: '⚖️', dual_use: '🔒' };
  return <span className="text-base">{icons[type] || '⚠️'}</span>;
};

/**
 * @description Sección B del ResultsPanel — análisis espejo exportador vs. importador.
 * Solo disponible para planes Pro, Team y Enterprise (mirrorAnalysis !== null).
 * Muestra tabla comparativa de subpartidas, riesgo aduanero, reglas de origen y alertas críticas.
 * @param {{ mirrorAnalysis: object, exporterCountry: string, importerCountry: string }} props
 */
export default function MirrorAnalysis({ mirrorAnalysis, exporterCountry, importerCountry }) {
  if (!mirrorAnalysis) return null;

  const { concordance, exporterSubheading, importerSubheading, divergences = [],
          riskAssessment, rulesOfOrigin, recommendedSubheading, criticalAlerts = [] } = mirrorAnalysis;

  const discrepancyRisk = RISK_CONFIG[concordance?.discrepancyLevel] || RISK_CONFIG.low;
  const riskLevel = RISK_CONFIG[riskAssessment?.level] || RISK_CONFIG.low;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="bg-slate-800/80 border border-blue-500/40 rounded-2xl p-6 space-y-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-400" />
          Análisis Espejo
        </h3>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${discrepancyRisk.cls}`}>
          {discrepancyRisk.label}
        </span>
      </div>

      {/* Tabla comparativa subpartidas */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left text-xs text-slate-400 uppercase font-semibold pb-2 pr-4 w-1/3"></th>
              <th className="text-left text-xs text-slate-400 uppercase font-semibold pb-2 pr-4">
                {exporterCountry} <span className="normal-case font-normal">(Exportador)</span>
              </th>
              <th className="text-left text-xs text-slate-400 uppercase font-semibold pb-2">
                {importerCountry} <span className="normal-case font-normal">(Importador)</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            <tr>
              <td className="py-3 pr-4 text-slate-400 font-medium">Subpartida nacional</td>
              <td className="py-3 pr-4 font-mono text-blue-300 font-semibold">
                {exporterSubheading?.code || '—'}
              </td>
              <td className="py-3 font-mono text-blue-300 font-semibold">
                {importerSubheading?.code || '—'}
              </td>
            </tr>
            <tr>
              <td className="py-3 pr-4 text-slate-400 font-medium">Descripción oficial</td>
              <td className="py-3 pr-4 text-slate-300 text-xs leading-relaxed">
                {exporterSubheading?.officialDescription || '—'}
              </td>
              <td className="py-3 text-slate-300 text-xs leading-relaxed">
                {importerSubheading?.officialDescription || '—'}
              </td>
            </tr>
            <tr>
              <td className="py-3 pr-4 text-slate-400 font-medium">Fuente consultada</td>
              <td className="py-3 pr-4 text-slate-400 text-xs">{exporterSubheading?.source || '—'}</td>
              <td className="py-3 text-slate-400 text-xs">{importerSubheading?.source || '—'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Concordancia */}
      <div className="flex items-center gap-2">
        {concordance?.match
          ? <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          : <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
        }
        <span className="text-sm text-slate-300">
          {concordance?.match
            ? 'Las subpartidas nacionales coinciden — clasificación coherente entre ambos países.'
            : 'Se detectaron divergencias entre las nomenclaturas nacionales.'}
        </span>
      </div>

      {/* Divergencias */}
      {divergences.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-slate-400 uppercase">Divergencias detectadas</p>
          {divergences.map((d, i) => (
            <div key={i} className="flex items-start gap-2 bg-yellow-900/10 border border-yellow-500/20 rounded-lg px-3 py-2">
              <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 mt-0.5 flex-shrink-0" />
              <p className="text-yellow-300 text-xs leading-relaxed">{d}</p>
            </div>
          ))}
        </div>
      )}

      {/* Riesgo aduanero */}
      {riskAssessment && (
        <div className="bg-slate-900/50 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-white">Riesgo aduanero</p>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${riskLevel.cls}`}>
                {riskLevel.label}
              </span>
              <span className="text-slate-400 text-xs">{riskAssessment.probability}% probabilidad</span>
            </div>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed">{riskAssessment.explanation}</p>
        </div>
      )}

      {/* Reglas de origen */}
      {rulesOfOrigin && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-slate-400 uppercase">Reglas de origen</p>
          <div className="flex flex-wrap gap-2 items-center">
            {rulesOfOrigin.agreementApplies
              ? <span className="bg-emerald-600/20 text-emerald-400 text-xs font-semibold px-3 py-1 rounded-full">
                  ✅ Acuerdo activo: {rulesOfOrigin.agreementName}
                </span>
              : <span className="bg-red-600/20 text-red-400 text-xs font-semibold px-3 py-1 rounded-full">
                  ❌ Sin acuerdo preferencial
                </span>
            }
            {rulesOfOrigin.agreementApplies && (
              <span className="text-slate-400 text-xs">
                Tasa preferencial: <span className="text-emerald-400 font-semibold">{rulesOfOrigin.preferentialRate}</span>
              </span>
            )}
          </div>
          {rulesOfOrigin.transformationRequired && (
            <p className="text-slate-400 text-xs">Transformación requerida: {rulesOfOrigin.transformationRequired}</p>
          )}
        </div>
      )}

      {/* Subpartida recomendada */}
      {recommendedSubheading?.code && (
        <div className="bg-emerald-900/10 border border-emerald-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <ArrowRight className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-semibold text-slate-300">Subpartida recomendada para declarar</span>
          </div>
          <p className="font-mono text-emerald-400 font-bold text-lg">{recommendedSubheading.code}</p>
          {recommendedSubheading.rationale && (
            <p className="text-slate-400 text-xs mt-1 leading-relaxed">{recommendedSubheading.rationale}</p>
          )}
        </div>
      )}

      {/* Alertas críticas */}
      {criticalAlerts.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-400 uppercase">Alertas críticas pre-embarque</p>
          {criticalAlerts.map((alert, i) => (
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
      )}
    </motion.div>
  );
}
