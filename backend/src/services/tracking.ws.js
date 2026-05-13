const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const { subscribeToVessel, unsubscribeFromVessel, getServiceStatus } = require('./aisstream.service');

/**
 * @description Establece el servidor WebSocket que reenvía posiciones AIS al frontend.
 * URL: ws://localhost:5000/tracking/ws
 * El cliente debe enviar un mensaje de auth con JWT tras conectarse.
 *
 * Protocolo de mensajes cliente → servidor:
 *   { type: 'auth',        token: '<JWT>' }
 *   { type: 'subscribe',   mmsi: '636017046' }
 *   { type: 'unsubscribe', mmsi: '636017046' }
 *   { type: 'status' }
 *
 * Protocolo de mensajes servidor → cliente:
 *   { type: 'auth_ok',    userId, companyId }
 *   { type: 'auth_error', message }
 *   { type: 'position',   mmsi, payload: VesselPosition }
 *   { type: 'static',     mmsi, payload: VesselStatic }
 *   { type: 'status',     payload: AISStatus }
 */
function setupTrackingWS(httpServer) {
  const wss = new WebSocket.Server({ server: httpServer, path: '/tracking/ws' });

  wss.on('connection', (ws) => {
    let authenticated = false;
    let clientInfo = null;
    const clientSubs = new Map(); // mmsi → unsubscribe function

    function send(data) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(data));
      }
    }

    ws.on('message', (raw) => {
      let msg;
      try { msg = JSON.parse(raw); } catch { return; }

      if (msg.type === 'auth') {
        try {
          const decoded = jwt.verify(msg.token, process.env.JWT_SECRET);
          authenticated = true;
          clientInfo = { userId: decoded.userId, companyId: decoded.companyId };
          send({ type: 'auth_ok', userId: decoded.userId });
        } catch {
          send({ type: 'auth_error', message: 'Token inválido' });
        }
        return;
      }

      if (!authenticated) {
        send({ type: 'auth_error', message: 'No autenticado' });
        return;
      }

      if (msg.type === 'subscribe' && msg.mmsi) {
        const mmsi = String(msg.mmsi);
        if (clientSubs.has(mmsi)) return; // ya suscrito

        const unsub = subscribeToVessel(mmsi, (event) => {
          send({ type: event.type, mmsi, payload: event.payload });
        });
        clientSubs.set(mmsi, unsub);
        send({ type: 'subscribed', mmsi });
      }

      if (msg.type === 'unsubscribe' && msg.mmsi) {
        const mmsi = String(msg.mmsi);
        const unsub = clientSubs.get(mmsi);
        if (unsub) {
          unsub();
          clientSubs.delete(mmsi);
        }
        send({ type: 'unsubscribed', mmsi });
      }

      if (msg.type === 'status') {
        send({ type: 'status', payload: getServiceStatus() });
      }
    });

    ws.on('close', () => {
      // Limpiar todas las suscripciones del cliente
      for (const unsub of clientSubs.values()) unsub();
      clientSubs.clear();
    });

    ws.on('error', (err) => {
      console.warn('[tracking.ws] Error en cliente WS:', err.message);
    });
  });

  console.log('✓ WebSocket de tracking activo en /tracking/ws');
  return wss;
}

module.exports = { setupTrackingWS };
