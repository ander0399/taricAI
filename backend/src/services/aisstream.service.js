const WebSocket = require('ws');

// Cache en memoria: MMSI → última posición conocida
const vesselCache = new Map();

// Suscriptores por MMSI: MMSI → Set de callbacks
const subscribers = new Map();

// Estado del servicio
let socket = null;
let reconnectAttempts = 0;
let reconnectTimer = null;
let isConnected = false;
let useDemoMode = false;
let demoIntervals = [];

const MAX_RECONNECT = 10;

// ── Mapeos AIS ────────────────────────────────────────────────────────────────

const NAV_STATUS_MAP = {
  0:  { label: 'Navegando',       icon: '🟢', uiState: 'underway'          },
  1:  { label: 'Anclado',         icon: '⚓', uiState: 'anchored'          },
  2:  { label: 'Sin gobierno',    icon: '🔴', uiState: 'not_under_command'  },
  3:  { label: 'Maniobra restringida', icon: '🟡', uiState: 'restricted'   },
  4:  { label: 'Calado limitado', icon: '🟡', uiState: 'constrained_draught'},
  5:  { label: 'Amarrado',        icon: '🔵', uiState: 'moored'            },
  6:  { label: 'Encallado',       icon: '🔴', uiState: 'aground'           },
  7:  { label: 'Pescando',        icon: '🎣', uiState: 'fishing'           },
  8:  { label: 'Navegando a vela',icon: '🟢', uiState: 'sailing'           },
  15: { label: 'Estado N/D',      icon: '⬜', uiState: 'undefined'         },
};

function mapNavStatus(code) {
  return NAV_STATUS_MAP[code] || NAV_STATUS_MAP[15];
}

function mapVesselType(typeCode) {
  if (typeCode >= 70 && typeCode <= 79) return 'Portacontenedores';
  if (typeCode >= 80 && typeCode <= 89) return 'Buque Tanque';
  if (typeCode >= 60 && typeCode <= 69) return 'Buque Pasajeros';
  if (typeCode >= 30 && typeCode <= 39) return 'Embarcación de Pesca';
  return `Tipo ${typeCode}`;
}

function calcSignalAge(timeUtcString) {
  if (!timeUtcString) return 999;
  const signalTime = new Date(timeUtcString).getTime();
  return Math.floor((Date.now() - signalTime) / 60000);
}

function getSignalState(ageMinutes) {
  if (ageMinutes < 5)   return 'live';
  if (ageMinutes < 20)  return 'recent';
  if (ageMinutes < 60)  return 'delayed';
  if (ageMinutes < 360) return 'estimated';
  return 'lost';
}

// ── Procesamiento de mensajes AIS ─────────────────────────────────────────────

function processAISMessage(rawMessage) {
  const { MessageType, MetaData, Message } = rawMessage;

  if (MessageType === 'PositionReport') {
    const pos  = Message.PositionReport;
    const meta = MetaData;
    const mmsi = String(pos.UserID);

    const heading  = pos.TrueHeading !== 511 ? pos.TrueHeading : pos.Cog;
    const navStatus = mapNavStatus(pos.NavigationalStatus);
    const signalAge = calcSignalAge(meta.time_utc);

    const vesselPosition = {
      mmsi,
      lat:               pos.Latitude,
      lng:               pos.Longitude,
      sog:               pos.Sog,
      cog:               pos.Cog,
      heading,
      rateOfTurn:        pos.RateOfTurn,
      navStatus,
      navStatusCode:     pos.NavigationalStatus,
      positionAccuracy:  pos.PositionAccuracy,
      timestamp:         meta.time_utc,
      signalAgeMinutes:  signalAge,
      signalState:       getSignalState(signalAge),
      source:            'aisstream_live',
      shipName:          meta.ShipName,
    };

    // Cache con TTL de 2 minutos
    vesselCache.set(mmsi, { data: vesselPosition, expiresAt: Date.now() + 120_000 });

    // Notificar a todos los suscriptores de este MMSI
    broadcastToSubscribers(mmsi, { type: 'position', payload: vesselPosition });
  }

  if (MessageType === 'ShipStaticData') {
    const staticData = Message.ShipStaticData;
    const meta = MetaData;
    const mmsi = String(staticData.UserID);

    const vesselStatic = {
      mmsi,
      imo:              String(staticData.ImoNumber),
      name:             staticData.Name?.trim(),
      callSign:         staticData.CallSign?.trim(),
      type:             staticData.Type,
      typeLabel:        mapVesselType(staticData.Type),
      loaMeters:        (staticData.Dimension?.A || 0) + (staticData.Dimension?.B || 0),
      beamMeters:       (staticData.Dimension?.C || 0) + (staticData.Dimension?.D || 0),
      draught:          staticData.MaximumStaticDraught,
      captainDestination: staticData.Destination?.trim(),
      captainEta:       staticData.Eta,
      source:           'aisstream_static',
      timestamp:        meta.time_utc,
    };

    // Cache 24 horas para datos estáticos
    vesselCache.set(`static:${mmsi}`, { data: vesselStatic, expiresAt: Date.now() + 86_400_000 });
    broadcastToSubscribers(mmsi, { type: 'static', payload: vesselStatic });
  }
}

function broadcastToSubscribers(mmsi, message) {
  const subs = subscribers.get(mmsi);
  if (!subs) return;
  for (const cb of subs) {
    try { cb(message); } catch { /* ignorar error en callback */ }
  }
}

// ── Suscripción a AISStream.io ────────────────────────────────────────────────

function buildSubscriptionMessage(mmsiList) {
  return JSON.stringify({
    APIKey: process.env.AISSTREAM_API_KEY,
    BoundingBoxes: [[[-90, -180], [90, 180]]],
    FiltersShipMMSI: mmsiList.map(String),
    FilterMessageTypes: ['PositionReport', 'ShipStaticData'],
  });
}

function sendSubscription() {
  if (!socket || socket.readyState !== WebSocket.OPEN) return;
  const activeMmsis = [...subscribers.keys()].filter(k => !k.startsWith('static:')).slice(0, 50);
  if (activeMmsis.length > 0) {
    socket.send(buildSubscriptionMessage(activeMmsis));
    console.log(`[AISStream] Suscrito a ${activeMmsis.length} buques`);
  }
}

function scheduleReconnect() {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  if (reconnectAttempts >= MAX_RECONNECT) {
    console.error('[AISStream] Máximo de reintentos. Activando modo demo.');
    activateDemoMode();
    return;
  }
  const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 60_000);
  reconnectAttempts++;
  console.log(`[AISStream] Reintento ${reconnectAttempts} en ${delay}ms`);
  reconnectTimer = setTimeout(() => connect(), delay);
}

function connect() {
  if (!process.env.AISSTREAM_API_KEY) {
    console.warn('[AISStream] AISSTREAM_API_KEY no configurado — modo demo activo');
    activateDemoMode();
    return;
  }

  socket = new WebSocket('wss://stream.aisstream.io/v0/stream');

  socket.onopen = () => {
    isConnected = true;
    reconnectAttempts = 0;
    useDemoMode = false;
    console.log('[AISStream] Conexión establecida');
    sendSubscription();
  };

  socket.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      processAISMessage(message);
    } catch (e) {
      console.warn('[AISStream] Error parseando mensaje:', e.message);
    }
  };

  socket.onerror = (error) => {
    console.error('[AISStream] Error WS:', error.message || 'unknown');
  };

  socket.onclose = () => {
    isConnected = false;
    console.warn('[AISStream] Conexión cerrada. Reconectando...');
    scheduleReconnect();
  };
}

// ── Modo demo (cuando no hay API key o AISStream está caído) ─────────────────

const DEMO_ROUTES = {
  '636017046': { // MSC BEATRICE (demo MMSI)
    name: 'MSC BEATRICE',
    waypoints: [
      { lat: 22.27, lng: 114.17, name: 'Yantian' },    // inicio
      { lat: 8.97,  lng: -79.53, name: 'Balboa Hub' }, // transshipment
      { lat: 3.87,  lng: -77.07, name: 'Buenaventura'},// destino
    ],
    startLat: 22.27, startLng: 114.17,
    endLat: 3.87, endLng: -77.07,
    sog: 18.4, heading: 225,
  },
};

function simulatePosition(mmsi) {
  const route = DEMO_ROUTES[mmsi];
  if (!route) return null;

  const now = Date.now();
  const elapsed = (now % (3600_000)) / 3600_000; // progreso 0-1 por hora
  const fromWp = route.waypoints[0];
  const toWp   = route.waypoints[1];

  const lat = fromWp.lat + (toWp.lat - fromWp.lat) * elapsed;
  const lng = fromWp.lng + (toWp.lng - fromWp.lng) * elapsed;

  return {
    mmsi,
    lat: parseFloat(lat.toFixed(4)),
    lng: parseFloat(lng.toFixed(4)),
    sog: route.sog + (Math.random() * 2 - 1),
    cog: route.heading,
    heading: route.heading,
    rateOfTurn: 0,
    navStatus: { label: 'Navegando', icon: '🟢', uiState: 'underway' },
    navStatusCode: 0,
    positionAccuracy: true,
    timestamp: new Date().toISOString(),
    signalAgeMinutes: 0,
    signalState: 'live',
    source: 'demo',
    shipName: route.name,
  };
}

function activateDemoMode() {
  useDemoMode = true;
  demoIntervals.forEach(clearInterval);
  demoIntervals = [];

  for (const mmsi of Object.keys(DEMO_ROUTES)) {
    const interval = setInterval(() => {
      if (!subscribers.has(mmsi)) return;
      const pos = simulatePosition(mmsi);
      if (!pos) return;
      vesselCache.set(mmsi, { data: pos, expiresAt: Date.now() + 120_000 });
      broadcastToSubscribers(mmsi, { type: 'position', payload: pos });
    }, 10_000); // cada 10 segundos en demo
    demoIntervals.push(interval);
  }
}

// ── API pública del servicio ──────────────────────────────────────────────────

function subscribeToVessel(mmsi, callback) {
  if (!subscribers.has(mmsi)) subscribers.set(mmsi, new Set());
  subscribers.get(mmsi).add(callback);

  // Si AISStream está abierto, re-suscribir con el nuevo MMSI
  if (isConnected) sendSubscription();

  // Si está en demo y el MMSI está en las rutas demo, iniciar simulación
  if (useDemoMode && DEMO_ROUTES[mmsi]) {
    const pos = simulatePosition(mmsi);
    if (pos) callback({ type: 'position', payload: pos });
  }

  return () => unsubscribeFromVessel(mmsi, callback);
}

function unsubscribeFromVessel(mmsi, callback) {
  const subs = subscribers.get(mmsi);
  if (!subs) return;
  subs.delete(callback);
  if (subs.size === 0) {
    subscribers.delete(mmsi);
    if (isConnected) sendSubscription();
  }
}

function getVesselPosition(mmsi) {
  const cached = vesselCache.get(mmsi);
  if (cached && cached.expiresAt > Date.now()) return cached.data;
  if (useDemoMode) return simulatePosition(mmsi);
  return null;
}

function getServiceStatus() {
  return {
    connected: isConnected,
    demoMode: useDemoMode,
    subscribedMmsis: [...subscribers.keys()].filter(k => !k.startsWith('static:')),
    cachedVessels: vesselCache.size,
  };
}

// Inicializar al cargar el módulo
connect();

module.exports = {
  connect,
  subscribeToVessel,
  unsubscribeFromVessel,
  getVesselPosition,
  getServiceStatus,
  getSignalState,
  calcSignalAge,
};
