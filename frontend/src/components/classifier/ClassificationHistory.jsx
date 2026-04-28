import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, ChevronLeft, ChevronRight, ArrowRight, AlertCircle, PlusCircle } from 'lucide-react';
import api from '../../services/api';

const STATUS_BADGE = {
  completed: 'bg-emerald-600/20 text-emerald-400',
  pending:   'bg-yellow-600/20 text-yellow-400',
  error:     'bg-red-600/20 text-red-400',
};
const STATUS_LABEL = { completed: 'Completado', pending: 'Procesando', error: 'Error' };

const INPUT_TYPE_LABEL = { text: '📝 Texto', image: '📷 Imagen', ocr: '📄 OCR' };

const RISK_COLOR = {
  low:      'text-emerald-400',
  medium:   'text-yellow-400',
  high:     'text-red-400',
  critical: 'text-red-300',
};

/**
 * @description Página de historial de clasificaciones arancelarias.
 * Free/Pro: muestra las del usuario. Team/Enterprise: muestra las de toda la empresa.
 * Soporta paginación. Al hacer clic en una fila, muestra el detalle expandido.
 *
 * @param {{ onNewClassification: Function }} props
 */
export default function ClassificationHistory({ onNewClassification }) {
  const [rows, setRows]           = useState([]);
  const [count, setCount]         = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage]           = useState(1);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [detail, setDetail]       = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchHistory = useCallback(async (p = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/classifier/history?page=${p}&limit=15`);
      const data = res.data.data;
      setRows(data.rows || []);
      setCount(data.count || 0);
      setTotalPages(data.totalPages || 1);
      setPage(p);
    } catch (err) {
      setError('No se pudo cargar el historial. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchHistory(1); }, [fetchHistory]);

  const handleRowClick = async (id) => {
    if (expandedId === id) { setExpandedId(null); setDetail(null); return; }
    setExpandedId(id);
    setDetail(null);
    setDetailLoading(true);
    try {
      const res = await api.get(`/classifier/history/${id}`);
      setDetail(res.data.data);
    } catch { setDetail(null); }
    finally { setDetailLoading(false); }
  };

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })
      + ' · ' + d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
  };

  // ── Estado vacío ─────────────────────────────────────────────
  if (!loading && rows.length === 0 && !error) {
    return (
      <div className="bg-slate-900 min-h-screen px-4 py-16 flex flex-col items-center justify-center text-center">
        <History className="w-16 h-16 text-slate-600 mb-4" />
        <p className="text-slate-400 text-lg font-semibold mb-1">Sin clasificaciones aún</p>
        <p className="text-slate-500 text-sm mb-6">Comienza clasificando un producto para ver tu historial aquí.</p>
        <button
          onClick={onNewClassification}
          className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-6 py-2.5 font-semibold transition flex items-center gap-2"
        >
          <PlusCircle className="w-4 h-4" />
          Hacer mi primera clasificación
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 min-h-screen px-4 py-8">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Historial de clasificaciones</h1>
            {count > 0 && <p className="text-slate-400 text-sm mt-0.5">{count} clasificaciones en total</p>}
          </div>
          <button
            onClick={onNewClassification}
            className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-4 py-2 text-sm font-semibold transition flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            Nueva
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 bg-red-900/20 border border-red-500/30 rounded-xl px-4 py-3 mb-4">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {/* Tabla */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
          {/* Cabecera */}
          <div className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-slate-700 text-xs text-slate-400 uppercase font-semibold tracking-wide">
            <span className="col-span-2">Fecha</span>
            <span className="col-span-4">Producto</span>
            <span className="col-span-2">Ruta</span>
            <span className="col-span-1">HS</span>
            <span className="col-span-2">Espejo</span>
            <span className="col-span-1">Estado</span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-500">Cargando...</div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {rows.map((row) => {
                const isExpanded = expandedId === row.id;
                const riskLevel = row.mirrorAnalysis?.riskAssessment?.level;

                return (
                  <div key={row.id}>
                    <button
                      onClick={() => handleRowClick(row.id)}
                      className="w-full grid grid-cols-12 gap-2 px-4 py-3.5 text-left hover:bg-slate-700/30 transition text-sm"
                    >
                      <span className="col-span-2 text-slate-400 text-xs leading-tight">
                        {formatDate(row.createdAt)}
                      </span>
                      <span className="col-span-4 text-slate-300 truncate">
                        <span className="mr-1.5 text-xs">{INPUT_TYPE_LABEL[row.inputType]}</span>
                        {row.resultJson?.productDescription
                          ? row.resultJson.productDescription.slice(0, 60) + (row.resultJson.productDescription.length > 60 ? '…' : '')
                          : row.inputData?.slice(0, 60) || '—'}
                      </span>
                      <span className="col-span-2 text-slate-400 flex items-center gap-1 text-xs">
                        <span>{row.originCountry || '—'}</span>
                        <ArrowRight className="w-3 h-3" />
                        <span>{row.destCountry || '—'}</span>
                      </span>
                      <span className="col-span-1 font-mono text-blue-300 font-semibold text-xs">
                        {row.hsCode || '—'}
                      </span>
                      <span className="col-span-2">
                        {riskLevel
                          ? <span className={`text-xs font-semibold ${RISK_COLOR[riskLevel]}`}>
                              {riskLevel === 'low' && '🟢 Bajo'}
                              {riskLevel === 'medium' && '🟡 Medio'}
                              {riskLevel === 'high' && '🔴 Alto'}
                              {riskLevel === 'critical' && '🔴 Crítico'}
                            </span>
                          : <span className="text-slate-600 text-xs">—</span>
                        }
                      </span>
                      <span className="col-span-1">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[row.status] || STATUS_BADGE.pending}`}>
                          {STATUS_LABEL[row.status] || row.status}
                        </span>
                      </span>
                    </button>

                    {/* Fila expandida — detalle */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden border-t border-slate-700/50"
                        >
                          <div className="px-6 py-4 bg-slate-900/40 text-sm text-slate-300 space-y-2">
                            {detailLoading && <p className="text-slate-500">Cargando detalle...</p>}
                            {!detailLoading && detail && (
                              <>
                                <p><span className="text-slate-400">Descripción: </span>{detail.resultJson?.productDescription || '—'}</p>
                                <p><span className="text-slate-400">Código HS: </span>
                                  <span className="font-mono text-blue-300 font-semibold">{detail.hsCode}</span>
                                  {' — '}{detail.resultJson?.primaryHsDescription}
                                </p>
                                {detail.confidence !== null && detail.confidence !== undefined && (
                                  <p><span className="text-slate-400">Confianza: </span>{detail.confidence}%</p>
                                )}
                                {detail.fuentes?.length > 0 && (
                                  <div>
                                    <p className="text-slate-400 mb-1">Fuentes consultadas ({detail.fuentes.length}):</p>
                                    <div className="flex flex-wrap gap-1.5">
                                      {detail.fuentes.map((f) => (
                                        <span key={f.id} className={`text-xs px-2 py-0.5 rounded-full ${
                                          f.responseStatus === 'ok'      ? 'bg-emerald-600/20 text-emerald-400' :
                                          f.responseStatus === 'timeout' ? 'bg-yellow-600/20 text-yellow-400' :
                                                                           'bg-red-600/20 text-red-400'
                                        }`}>
                                          {f.responseStatus === 'ok' ? '✅' : f.responseStatus === 'timeout' ? '⏱️' : '⚠️'} {f.sourceName}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-5">
            <button
              onClick={() => fetchHistory(page - 1)}
              disabled={page <= 1}
              className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-slate-400 text-sm px-3">Página {page} de {totalPages}</span>
            <button
              onClick={() => fetchHistory(page + 1)}
              disabled={page >= totalPages}
              className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
