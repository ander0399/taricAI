import { motion } from 'framer-motion';
import { FileText, FileOutput, FileInput, AlertTriangle, ExternalLink } from 'lucide-react';
import { detectVersion, getExportDocuments, getImportDocuments } from '../../utils/classification.compat';

const BADGE = {
  required:    'bg-red-600/20 text-red-400',
  optional:    'bg-slate-700 text-slate-400',
  Obligatorio: 'bg-red-600/20 text-red-400',
  Condicional: 'bg-yellow-600/20 text-yellow-400',
  Recomendado: 'bg-blue-600/20 text-blue-300',
};

/**
 * @description Renderiza un documento individual en formato v2.2 o legacy.
 */
function DocItem({ doc, version }) {
  if (version === 'v2.2') {
    const badgeCls = doc.required ? BADGE.required : BADGE.optional;
    return (
      <li className="flex items-start gap-2.5 py-2.5 border-b border-slate-700/50 last:border-0">
        <div className="w-4 h-4 mt-0.5 flex-shrink-0 rounded border border-slate-600 bg-slate-700" />
        <div className="flex-1 min-w-0">
          <p className="text-slate-300 text-sm font-medium leading-snug">{doc.document}</p>
          {doc.description && (
            <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">{doc.description}</p>
          )}
          {doc.issuedBy && (
            <p className="text-slate-600 text-xs mt-0.5">Emitido por: {doc.issuedBy}</p>
          )}
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mt-1 inline-block ${badgeCls}`}>
            {doc.required ? 'Obligatorio' : 'Opcional'}
          </span>
        </div>
      </li>
    );
  }

  // Legacy format
  const isString = typeof doc === 'string';
  const name     = isString ? doc : (doc.name || doc);
  const urgency  = isString ? 'Obligatorio' : (doc.urgency || 'Obligatorio');
  const link     = isString ? null : doc.link;
  const badgeCls = BADGE[urgency] || BADGE.Obligatorio;

  return (
    <li className="flex items-start gap-2.5 py-2 border-b border-slate-700/50 last:border-0">
      <div className="w-4 h-4 mt-0.5 flex-shrink-0 rounded border border-slate-600 bg-slate-700" />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <span className="text-slate-300 text-sm leading-snug">{name}</span>
          {link && (
            <a href={link} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
              <ExternalLink className="w-3.5 h-3.5 text-blue-400 hover:text-blue-300 transition" />
            </a>
          )}
        </div>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mt-1 inline-block ${badgeCls}`}>
          {urgency}
        </span>
      </div>
    </li>
  );
}

/**
 * @description Sección E del ResultsPanel — documentos requeridos en formato espejo.
 *              Layout de 2 columnas: exportación (izquierda) e importación (derecha).
 *              Soporta formato legacy y v2.2. Sección adicional para documentos críticos.
 *
 * @param {{ resultJson: object|null, mirrorAnalysis: object|null, exporterCountryName: string, importerCountryName: string }} props
 */
export default function DocumentsChecklist({ resultJson, mirrorAnalysis, exporterCountryName, importerCountryName }) {
  const version    = detectVersion(resultJson);
  const exportDocs = getExportDocuments(resultJson, version);
  const importDocs = getImportDocuments(resultJson, version);
  const criticalMissing = mirrorAnalysis?.documentComparison?.criticalMissing || [];

  const isEmpty = exportDocs.length === 0 && importDocs.length === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-6"
    >
      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
        <FileText className="w-5 h-5 text-blue-400" />
        Documentos Requeridos
      </h3>

      {isEmpty ? (
        <p className="text-slate-400 text-sm">
          Documentación específica no disponible en las fuentes consultadas.
          Se recomienda consultar con agente aduanal del país importador.
        </p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Columna izquierda — Exportación */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <FileOutput className="w-3.5 h-3.5" />
              Exportación desde {exporterCountryName || 'país exportador'}
            </p>
            {exportDocs.length > 0
              ? <ul className="space-y-0">{exportDocs.map((doc, i) => <DocItem key={i} doc={doc} version={version} />)}</ul>
              : <p className="text-slate-500 text-sm">Sin requisitos específicos identificados en fuentes consultadas.</p>
            }
          </div>

          {/* Columna derecha — Importación */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <FileInput className="w-3.5 h-3.5" />
              Importación en {importerCountryName || 'país importador'}
            </p>
            {importDocs.length > 0
              ? <ul className="space-y-0">{importDocs.map((doc, i) => <DocItem key={i} doc={doc} version={version} />)}</ul>
              : <p className="text-slate-500 text-sm">Sin requisitos específicos identificados en fuentes consultadas.</p>
            }
          </div>
        </div>
      )}

      {/* Documentos críticos — frecuentemente olvidados */}
      {criticalMissing.length > 0 && (
        <div className="bg-yellow-600/10 border border-yellow-500/30 rounded-2xl p-5">
          <p className="text-sm font-semibold text-yellow-400 flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4" />
            ⚠️ Documentos críticos — no olvidar
          </p>
          <ul className="space-y-2">
            {criticalMissing.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-yellow-400 mt-0.5">•</span>
                <span className="text-yellow-300 text-sm leading-relaxed">{typeof item === 'string' ? item : item.document}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
}
