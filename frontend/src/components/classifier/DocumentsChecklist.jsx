import { motion } from 'framer-motion';
import { FileText, ExternalLink } from 'lucide-react';

const URGENCY_BADGE = {
  Obligatorio:  'bg-red-600/20 text-red-400',
  Condicional:  'bg-yellow-600/20 text-yellow-400',
  Recomendado:  'bg-blue-600/20 text-blue-300',
};

/**
 * @description Sección E del ResultsPanel — documentos requeridos para exportar e importar.
 * Muestra dos columnas con los documentos, su urgencia y links a fuentes oficiales si están disponibles.
 * @param {{ tariffData: object|null }} props
 */
export default function DocumentsChecklist({ tariffData }) {
  const exportDocs = tariffData?.requiredDocumentsExport || [];
  const importDocs = tariffData?.requiredDocumentsImport || [];

  const renderDoc = (doc, i) => {
    const isString = typeof doc === 'string';
    const name = isString ? doc : (doc.name || doc);
    const urgency = isString ? 'Obligatorio' : (doc.urgency || 'Obligatorio');
    const link = isString ? null : doc.link;

    return (
      <li key={i} className="flex items-start gap-2.5 py-2 border-b border-slate-700/50 last:border-0">
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
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mt-1 inline-block ${URGENCY_BADGE[urgency] || URGENCY_BADGE.Obligatorio}`}>
            {urgency}
          </span>
        </div>
      </li>
    );
  };

  const isEmpty = exportDocs.length === 0 && importDocs.length === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="bg-slate-800 border border-slate-700 rounded-2xl p-6"
    >
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <FileText className="w-5 h-5 text-blue-400" />
        Documentos Requeridos
      </h3>

      {isEmpty ? (
        <p className="text-slate-400 text-sm">Documentación específica no disponible en las fuentes consultadas.</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Para exportar</p>
            {exportDocs.length > 0
              ? <ul className="space-y-0">{exportDocs.map(renderDoc)}</ul>
              : <p className="text-slate-500 text-sm">Sin requisitos específicos identificados</p>
            }
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Para importar</p>
            {importDocs.length > 0
              ? <ul className="space-y-0">{importDocs.map(renderDoc)}</ul>
              : <p className="text-slate-500 text-sm">Sin requisitos específicos identificados</p>
            }
          </div>
        </div>
      )}
    </motion.div>
  );
}
