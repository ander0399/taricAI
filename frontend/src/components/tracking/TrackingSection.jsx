import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Ship, AlertTriangle } from 'lucide-react';
import TrackingHeader from './TrackingHeader';
import TrackingMap from './TrackingMap';
import ShipmentPanel from './ShipmentPanel';
import { useTracking } from '../../hooks/useTracking';

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-16 px-4 space-y-4">
      <Ship className="w-12 h-12 text-slate-600" />
      <div>
        <p className="text-white font-semibold text-lg">Sin envíos activos</p>
        <p className="text-slate-500 text-sm mt-1 max-w-xs">
          Registra tu primer envío para rastrear tu carga en tiempo real.
        </p>
      </div>
    </div>
  );
}

function ErrorState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-16 space-y-3">
      <AlertTriangle className="w-8 h-8 text-red-400" />
      <p className="text-red-300 text-sm">{message}</p>
    </div>
  );
}

/**
 * @description Módulo principal de trazabilidad de carga en tiempo real.
 * Integra el mapa Leaflet, el panel lateral de detalle y el header con selector.
 * AISStream.io → backend WS → useTracking hook → Redux → componentes.
 */
export default function TrackingSection() {
  const {
    shipments, selectedShipment, loading, error,
    vesselPositions, signalState, wsConnected,
    loadShipments, selectShipment, closePanel, markEvent,
  } = useTracking();

  const [mapHeight] = useState('500px');

  useEffect(() => {
    loadShipments();
  }, [loadShipments]);

  return (
    <section className="bg-slate-900 border border-slate-700/50 rounded-2xl overflow-hidden">
      {/* Header con selector de envíos y señal AIS */}
      <TrackingHeader
        shipments={shipments}
        selectedId={selectedShipment?.id}
        onSelectShipment={selectShipment}
        signalState={signalState}
        wsConnected={wsConnected}
      />

      {/* Cuerpo del módulo */}
      <div className="relative" style={{ height: mapHeight }}>
        {/* Estados de carga y error */}
        {loading && !shipments.length && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-10">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
              <p className="text-slate-400 text-sm">Conectando con AISStream.io...</p>
            </div>
          </div>
        )}

        {error && <ErrorState message={error} />}

        {!loading && !error && shipments.length === 0 && <EmptyState />}

        {/* Mapa (cuando hay envíos) */}
        {shipments.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full h-full"
          >
            <TrackingMap
              shipment={selectedShipment || shipments[0] ? {
                ...shipments[0],
                // Si hay envío seleccionado, usarlo; si no, usar el primero de la lista
                ...(selectedShipment || {}),
                vessel: {
                  mmsi:         selectedShipment?.vessel?.mmsi || shipments[0]?.vesselMmsi,
                  name:         selectedShipment?.carrier?.vesselName || shipments[0]?.vesselName,
                  lat:          selectedShipment?.vessel?.lat || shipments[0]?.vesselLat,
                  lng:          selectedShipment?.vessel?.lng || shipments[0]?.vesselLng,
                  heading:      selectedShipment?.vessel?.heading || shipments[0]?.vesselHeading,
                  navStatusCode: selectedShipment?.vessel?.navStatusCode || shipments[0]?.vesselNavStatus,
                  signalState:  selectedShipment?.vessel?.signalState || shipments[0]?.signalState,
                },
                routeJson: selectedShipment?.route || shipments[0]?.routeJson || [],
                carrier: {
                  vesselName: selectedShipment?.carrier?.vesselName || shipments[0]?.vesselName,
                },
              } : null}
              vesselPositions={vesselPositions}
              onShipmentClick={selectShipment}
            />
          </motion.div>
        )}

        {/* Panel lateral deslizante */}
        {selectedShipment && (
          <div className="absolute top-0 right-0 h-full pointer-events-auto z-20">
            <ShipmentPanel
              shipment={selectedShipment}
              onClose={closePanel}
              onMarkEvent={(code, val) => markEvent(selectedShipment.id, code, val)}
            />
          </div>
        )}
      </div>
    </section>
  );
}
