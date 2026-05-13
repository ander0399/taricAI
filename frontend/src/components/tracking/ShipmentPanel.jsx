import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, ExternalLink, Navigation, Thermometer, Package } from 'lucide-react';
import DndCounter from './DndCounter';
import MilestoneTimeline from './MilestoneTimeline';
import SignalBadge from './SignalBadge';

function formatETA(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function CopyButton({ value }) {
  const copy = () => { try { navigator.clipboard.writeText(value); } catch {} };
  return (
    <button onClick={copy} className="p-1 hover:text-white transition" title="Copiar">
      <Copy className="w-3.5 h-3.5" />
    </button>
  );
}

function InfoRow({ label, value, mono = false }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-slate-700/40 last:border-0">
      <span className="text-xs text-slate-500">{label}</span>
      <span className={`text-xs text-slate-300 ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}

function SectionHeader({ children }) {
  return (
    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 pt-3 pb-1 border-b border-slate-700/60">
      {children}
    </p>
  );
}

export default function ShipmentPanel({ shipment, onClose, onMarkEvent }) {
  if (!shipment) return null;

  const { container, booking, carrier, vessel, eta, dnd, events = [], reefer, co2TonEstimate, activeAlerts = [] } = shipment;
  const signalState = vessel?.signalState || 'estimated';

  return (
    <AnimatePresence>
      <motion.aside
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 right-0 h-full w-full sm:w-[420px] bg-[#0F1B2D] border-l border-[#1E3050] z-50 flex flex-col shadow-2xl overflow-hidden"
        role="complementary"
        aria-label="Panel de detalle del envío"
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E3050] flex-shrink-0">
          <div>
            <h2 className="text-white font-semibold text-base">{carrier?.vesselName || 'Buque desconocido'}</h2>
            {vessel?.mmsi && (
              <p className="text-slate-500 text-xs font-mono mt-0.5">MMSI: {vessel.mmsi}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <SignalBadge state={signalState} size="sm" />
            <button onClick={onClose} className="p-1.5 hover:bg-slate-700 rounded-lg transition" aria-label="Cerrar panel">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* ── Scroll body ────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-5 pb-8 space-y-1" style={{ scrollbarWidth: 'thin' }}>

          {/* Alertas activas */}
          {activeAlerts.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {activeAlerts.map((alert, i) => (
                <div key={i} className="bg-red-900/20 border border-red-500/30 rounded-lg px-3 py-2 text-red-300 text-xs">
                  ⚠️ {alert.description || alert}
                </div>
              ))}
            </div>
          )}

          {/* ── Señal AIS ──────────────────────────────────────────────────── */}
          {vessel && (
            <div className="mt-3 bg-slate-800/50 rounded-xl p-3 space-y-2">
              <SectionHeader>Señal AIS (AISStream.io)</SectionHeader>
              <div className="grid grid-cols-2 gap-x-4">
                <InfoRow label="Latitud"   value={vessel.lat?.toFixed(4)} mono />
                <InfoRow label="Longitud"  value={vessel.lng?.toFixed(4)} mono />
                <InfoRow label="Velocidad" value={vessel.sog != null ? `${vessel.sog.toFixed(1)} kn` : null} mono />
                <InfoRow label="Rumbo"     value={vessel.cog != null ? `${vessel.cog.toFixed(0)}°` : null} mono />
              </div>
              {vessel.signalAgeMinutes != null && (
                <p className="text-xs text-slate-500">Señal: hace {vessel.signalAgeMinutes} min · Fuente: {vessel.aisSource || '—'}</p>
              )}
            </div>
          )}

          {/* ── Contenedor ─────────────────────────────────────────────────── */}
          {container && (
            <div className="bg-slate-800/50 rounded-xl p-3">
              <SectionHeader>Mi Contenedor</SectionHeader>
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-4 h-4 text-blue-400" />
                <span className="font-mono text-blue-300 font-semibold text-sm">{container.number || '—'}</span>
                {container.number && <CopyButton value={container.number} />}
              </div>
              <InfoRow label="Tipo"          value={container.type} />
              <InfoRow label="Sello"         value={container.sealNumber} mono />
              <InfoRow label="Peso bruto"    value={container.grossWeightKg ? `${container.grossWeightKg.toLocaleString()} kg` : null} />
              <InfoRow label="Volumen"       value={container.volumeM3 ? `${container.volumeM3} m³` : null} />
              <InfoRow label="N° BL"         value={booking?.blNumber} mono />
              <InfoRow label="Booking"       value={booking?.bookingNumber} mono />
              <InfoRow label="Incoterm"      value={booking?.incoterm} />
            </div>
          )}

          {/* ── ETA Oficial ────────────────────────────────────────────────── */}
          {eta && (
            <div className="bg-slate-800/50 rounded-xl p-3">
              <SectionHeader>ETA Oficial</SectionHeader>
              <InfoRow label="Área del puerto"  value={formatETA(eta.port)} />
              <InfoRow label="Atraque en berth" value={formatETA(eta.berth)} />
              <InfoRow label="Descarga"         value={formatETA(eta.discharge)} />
              <InfoRow label="Gate-out"         value={formatETA(eta.gateOut)} />
              <p className="text-xs text-slate-600 mt-1">
                Fuente: {eta.source || '—'} · Confiabilidad: {eta.confidence || '—'}
              </p>
            </div>
          )}

          {/* ── Naviera ────────────────────────────────────────────────────── */}
          {carrier && (
            <div className="bg-slate-800/50 rounded-xl p-3">
              <SectionHeader>Buque y Naviera</SectionHeader>
              <InfoRow label="Naviera booking"  value={carrier.name} />
              <InfoRow label="Buque real"       value={carrier.vesselName} />
              <InfoRow label="IMO"              value={carrier.vesselImo} mono />
              <InfoRow label="Voyage"           value={carrier.voyageNumber} mono />
              <InfoRow label="Servicio"         value={carrier.serviceCode} />
              <InfoRow label="Alianza"          value={carrier.allianceName} />
            </div>
          )}

          {/* ── D&D ────────────────────────────────────────────────────────── */}
          {shipment.dnd && (
            <DndCounter dnd={shipment.dnd} />
          )}

          {/* ── Reefer ─────────────────────────────────────────────────────── */}
          {reefer && (
            <div className="bg-slate-800/50 rounded-xl p-3">
              <SectionHeader>Monitor de Temperatura (Reefer)</SectionHeader>
              <div className="flex items-center gap-2 mb-2">
                <Thermometer className="w-4 h-4 text-blue-400" />
                <span className="text-slate-300 font-semibold text-sm">
                  {reefer.currentTempC != null ? `${reefer.currentTempC}°C` : '—'}
                </span>
                <span className="text-slate-500 text-xs">· Setpoint: {reefer.setpointC}°C</span>
              </div>
              {reefer.lastReadingAt && (
                <p className="text-xs text-slate-500">Última lectura: {formatETA(reefer.lastReadingAt)}</p>
              )}
            </div>
          )}

          {/* ── CO₂ ────────────────────────────────────────────────────────── */}
          {co2TonEstimate != null && (
            <div className="bg-slate-800/50 rounded-xl p-3">
              <SectionHeader>Huella de Carbono</SectionHeader>
              <p className="text-slate-300 text-sm">
                🌱 <span className="font-semibold">{co2TonEstimate.toFixed(2)}</span> toneladas CO₂ estimadas
                <span className="text-slate-500 text-xs ml-2">(14.5 g CO₂/ton·nm)</span>
              </p>
            </div>
          )}

          {/* ── Timeline de eventos ─────────────────────────────────────────── */}
          {events.length > 0 && (
            <div className="bg-slate-800/50 rounded-xl p-3">
              <SectionHeader>Itinerario Completo</SectionHeader>
              <MilestoneTimeline events={events} onMarkEvent={onMarkEvent} />
            </div>
          )}
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}
