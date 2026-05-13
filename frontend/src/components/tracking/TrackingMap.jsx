import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet icon path issue with webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ── Íconos SVG customizados ───────────────────────────────────────────────────

function makeVesselIcon(heading = 0, navStatusCode = 0, signalState = 'live') {
  const vesselColors = { 0: '#FFFFFF', 1: '#F6C344', 5: '#4A9EFF', 6: '#FF6B6B' };
  const color = vesselColors[navStatusCode] || '#FFFFFF';
  const haloColor = signalState === 'live' ? '#00C896' : signalState === 'recent' ? '#4A9EFF' : signalState === 'delayed' ? '#F6C344' : 'transparent';
  const showHalo = ['live', 'recent', 'delayed'].includes(signalState);

  const svg = `
    <svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      ${showHalo ? `<circle cx="24" cy="24" r="20" fill="${haloColor}" opacity="0.2"/>` : ''}
      <g transform="rotate(${heading}, 24, 24)">
        <path d="M24 6 L32 34 L24 30 L16 34 Z" fill="${color}" stroke="#1A2332" stroke-width="1.5"/>
      </g>
    </svg>`;

  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [48, 48],
    iconAnchor: [24, 24],
    popupAnchor: [0, -24],
  });
}

function makePortIcon(type) {
  const configs = {
    origin:        { color: '#FFB347', symbol: '⚓', size: 28 },
    destination:   { color: '#FF6B6B', symbol: '★', size: 28 },
    transshipment: { color: '#F6C344', symbol: '⇄', size: 24 },
    waypoint:      { color: '#A0B4C8', symbol: '⊙', size: 20 },
  };
  const cfg = configs[type] || configs.waypoint;

  return L.divIcon({
    html: `<div style="width:${cfg.size}px;height:${cfg.size}px;background:${cfg.color};border-radius:50%;border:2px solid #0F1B2D;display:flex;align-items:center;justify-content:center;font-size:${cfg.size * 0.5}px;line-height:1;">${cfg.symbol}</div>`,
    className: '',
    iconSize:   [cfg.size, cfg.size],
    iconAnchor: [cfg.size / 2, cfg.size / 2],
    popupAnchor: [0, -cfg.size / 2],
  });
}

// ── Componente de auto-fit de bounds ─────────────────────────────────────────

function AutoFitBounds({ routePoints, vesselPos }) {
  const map = useMap();

  useEffect(() => {
    const pts = [...routePoints];
    if (vesselPos) pts.push(vesselPos);
    if (pts.length < 1) return;

    const bounds = L.latLngBounds(pts.map(p => [p.lat, p.lng]));
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 8 });
  }, []); // Solo al montar

  return null;
}

// ── Componente principal ─────────────────────────────────────────────────────

export default function TrackingMap({ shipment, vesselPositions, onShipmentClick }) {
  const vessel   = shipment?.vessel || {};
  const route    = shipment?.routeJson || [];
  const mmsi     = vessel.mmsi;

  // Posición actual del buque (desde WS o desde el modelo)
  const livePos  = mmsi && vesselPositions[mmsi] ? vesselPositions[mmsi] : null;
  const vesselLat = livePos?.lat ?? vessel.lat;
  const vesselLng = livePos?.lng ?? vessel.lng;
  const heading   = livePos?.heading ?? vessel.heading ?? 0;
  const navCode   = livePos?.navStatusCode ?? vessel.navStatusCode ?? 0;
  const sigState  = livePos?.signalState ?? vessel.signalState ?? 'estimated';

  // Puntos completados vs pendientes para la ruta
  const completedPts = route
    .filter(p => p.isCompleted && p.lat && p.lng)
    .map(p => [p.lat, p.lng]);

  const pendingPts = route
    .filter(p => !p.isCompleted && p.lat && p.lng)
    .map(p => [p.lat, p.lng]);

  // Conectar el último punto completado con el primero pendiente
  const lastCompleted = completedPts[completedPts.length - 1];
  const firstPending  = pendingPts[0];
  const currentLegPts = lastCompleted && vesselLat && vesselLng && firstPending
    ? [[...lastCompleted], [vesselLat, vesselLng], [...firstPending]]
    : [];

  // Centro inicial del mapa
  const center = vesselLat && vesselLng
    ? [vesselLat, vesselLng]
    : route[0] ? [route[0].lat, route[0].lng] : [10, -40];

  const vesselIcon = makeVesselIcon(heading, navCode, sigState);

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden">
      <MapContainer
        center={center}
        zoom={4}
        className="w-full h-full"
        zoomControl={true}
        style={{ background: '#08111E' }}
      >
        {/* Tiles oscuros (CartoDB Dark Matter) */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com">CartoDB</a>'
          subdomains="abcd"
          maxZoom={19}
        />

        {/* Auto-fit de bounds */}
        <AutoFitBounds
          routePoints={route.filter(p => p.lat && p.lng)}
          vesselPos={vesselLat && vesselLng ? { lat: vesselLat, lng: vesselLng } : null}
        />

        {/* ── Ruta completada (sólida verde) */}
        {completedPts.length > 1 && (
          <Polyline
            positions={completedPts}
            pathOptions={{ color: '#00C896', weight: 3.5, opacity: 0.9 }}
          />
        )}

        {/* ── Tramo actual (buque → próximo puerto, azul) */}
        {currentLegPts.length > 0 && (
          <Polyline
            positions={currentLegPts}
            pathOptions={{ color: '#4A9EFF', weight: 2.5, opacity: 0.8, dashArray: '8 6' }}
          />
        )}

        {/* ── Ruta pendiente (punteada azul claro) */}
        {pendingPts.length > 1 && (
          <Polyline
            positions={pendingPts}
            pathOptions={{ color: '#4A9EFF', weight: 2, opacity: 0.5, dashArray: '5 8' }}
          />
        )}

        {/* ── Marcadores de puertos */}
        {route.map((port, i) => port.lat && port.lng ? (
          <Marker key={i} position={[port.lat, port.lng]} icon={makePortIcon(port.type)}>
            <Popup className="tracking-popup">
              <div className="text-xs font-mono text-slate-800">
                <p className="font-bold text-sm">{port.name}</p>
                <p className="text-slate-500">{port.locode}</p>
                {port.ata && <p>ATA: {new Date(port.ata).toLocaleDateString('es-CO')}</p>}
                {!port.ata && port.eta && <p>ETA: {new Date(port.eta).toLocaleDateString('es-CO')}</p>}
              </div>
            </Popup>
          </Marker>
        ) : null)}

        {/* ── Buque (posición AIS) */}
        {vesselLat && vesselLng && (
          <Marker
            position={[vesselLat, vesselLng]}
            icon={vesselIcon}
            eventHandlers={{ click: onShipmentClick ? () => onShipmentClick(shipment?.id) : undefined }}
          >
            <Popup>
              <div className="text-xs">
                <p className="font-bold">{vessel.name || shipment?.carrier?.vesselName}</p>
                {livePos && (
                  <>
                    <p>{livePos.sog?.toFixed(1)} kn · {livePos.cog?.toFixed(0)}°</p>
                    <p className="text-slate-500">{livePos.navStatus?.label}</p>
                  </>
                )}
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
