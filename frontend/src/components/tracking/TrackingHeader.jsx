import { useState } from 'react';
import { Search, ChevronDown, Package, Maximize2 } from 'lucide-react';
import SignalBadge from './SignalBadge';

const STATUS_LABELS = {
  booking_confirmed:      'Booking',
  at_origin_terminal:     'En terminal origen',
  on_board:               'En buque',
  in_transit_sea:         'En tránsito',
  at_transshipment:       'En transshipment',
  in_transit_sea_leg2:    'Tránsito 2ª etapa',
  at_destination_anchorage: 'Fondeado',
  berthed_at_destination: 'Atracado',
  discharged:             'Descargado',
  customs_process:        'En aduana',
  available_pickup:       'Disponible',
  in_transit_land:        'Última milla',
  delivered:              '✅ Entregado',
  rollover_detected:      '⚠️ Rollover',
};

function ShipmentChip({ shipment, isSelected, onClick }) {
  const hasAlert = shipment.activeAlerts?.length > 0;
  const dndUrgent = ['urgent', 'expired'].includes(shipment.dndStatus);

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all text-xs ${
        isSelected
          ? 'bg-blue-600/20 border border-blue-500/40 text-white'
          : 'bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:border-slate-600 hover:text-slate-200'
      }`}
    >
      <Package className="w-3.5 h-3.5 flex-shrink-0" />
      <div className="min-w-0">
        <p className="font-mono font-semibold truncate text-[11px]">
          {shipment.containerNumber || shipment.reference || 'Sin ref.'}
        </p>
        <p className="text-slate-500 truncate text-[10px]">
          {shipment.carrierName} · {STATUS_LABELS[shipment.status] || shipment.status}
        </p>
      </div>
      {(hasAlert || dndUrgent) && (
        <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-red-400" />
      )}
    </button>
  );
}

export default function TrackingHeader({
  shipments = [], selectedId, onSelectShipment, signalState, wsConnected,
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = query.trim()
    ? shipments.filter(s =>
        (s.containerNumber || '').toLowerCase().includes(query.toLowerCase()) ||
        (s.blNumber || '').toLowerCase().includes(query.toLowerCase()) ||
        (s.vesselName || '').toLowerCase().includes(query.toLowerCase()) ||
        (s.reference || '').toLowerCase().includes(query.toLowerCase())
      )
    : shipments;

  const selected = shipments.find(s => s.id === selectedId);
  const alertCount = shipments.reduce((n, s) => n + (s.activeAlerts?.length || 0), 0);
  const dndWarnCount = shipments.filter(s => ['warning', 'urgent', 'expired'].includes(s.dndStatus)).length;

  return (
    <div className="bg-[#0F1B2D] border-b border-[#1E3050] px-4 py-3 flex-shrink-0">
      <div className="flex items-center justify-between gap-3">
        {/* Título y estado AIS */}
        <div className="flex items-center gap-3">
          <h2 className="text-white font-semibold text-base whitespace-nowrap">
            📦 Mi Carga en Tiempo Real
          </h2>
          <SignalBadge state={signalState} />
        </div>

        {/* Selector de envío */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Botón selector */}
          <button
            onClick={() => setSearchOpen(v => !v)}
            className="flex items-center gap-1.5 bg-slate-800/60 border border-slate-700 hover:border-slate-500 rounded-lg px-3 py-1.5 text-xs text-slate-300 transition min-w-0 flex-1 max-w-xs"
          >
            <span className="truncate">
              {selected
                ? `${selected.containerNumber || selected.reference} · ${selected.carrierName || '—'}`
                : `${shipments.length} envíos activos`}
            </span>
            <ChevronDown className="w-3.5 h-3.5 flex-shrink-0 text-slate-500" />
          </button>

          {/* Alertas y D&D */}
          {(alertCount > 0 || dndWarnCount > 0) && (
            <div className="flex items-center gap-1.5 text-[10px]">
              {alertCount > 0 && (
                <span className="bg-red-600/20 text-red-400 px-2 py-0.5 rounded-full font-semibold">
                  ⚠️ {alertCount} alerta{alertCount !== 1 ? 's' : ''}
                </span>
              )}
              {dndWarnCount > 0 && (
                <span className="bg-yellow-600/20 text-yellow-400 px-2 py-0.5 rounded-full font-semibold">
                  ⏱ D&D: {dndWarnCount}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Dropdown de selección de envío */}
      {searchOpen && (
        <div className="mt-2 bg-slate-800 border border-slate-700 rounded-xl p-2 space-y-1.5 max-h-64 overflow-y-auto">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar contenedor, BL, buque..."
              className="w-full bg-slate-900 text-slate-300 text-xs pl-8 pr-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500/50 placeholder-slate-600"
            />
          </div>

          {/* Lista de envíos */}
          {filtered.length === 0 && (
            <p className="text-center text-slate-500 text-xs py-3">Sin resultados</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {filtered.map(s => (
              <ShipmentChip
                key={s.id}
                shipment={s}
                isSelected={s.id === selectedId}
                onClick={() => { onSelectShipment(s.id); setSearchOpen(false); setQuery(''); }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
