import { useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  setLoading, setError, setShipments, setSelectedShipment, clearSelected,
  updateVesselPosition, setSignalState, setWsConnected, removeShipment, addShipment,
} from '../store/slices/trackingSlice';
import {
  getShipments, getShipmentById, createShipment, updateShipment,
  deleteShipment, updateEvent,
} from '../services/tracking.api';

const WS_URL = (process.env.REACT_APP_API_URL || 'http://localhost:5000')
  .replace(/^http/, 'ws') + '/tracking/ws';

export function useTracking() {
  const dispatch = useDispatch();
  const state    = useSelector((s) => s.tracking);
  const wsRef    = useRef(null);
  const tokenRef = useRef(localStorage.getItem('token'));
  const subsRef  = useRef(new Set()); // MMSIs actualmente suscritos

  // ── WebSocket lifecycle ───────────────────────────────────────────────────────
  const connectWS = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      dispatch(setWsConnected(true));
      // Auth inmediata
      ws.send(JSON.stringify({ type: 'auth', token: tokenRef.current }));
      // Re-suscribir MMSIs activos
      for (const mmsi of subsRef.current) {
        ws.send(JSON.stringify({ type: 'subscribe', mmsi }));
      }
    };

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        if (msg.type === 'position') {
          dispatch(updateVesselPosition({ mmsi: msg.mmsi, position: msg.payload }));
          dispatch(setSignalState(msg.payload.signalState || 'live'));
        }
        if (msg.type === 'auth_error') console.warn('[tracking.ws] Auth error:', msg.message);
      } catch { /* ignorar mensajes malformados */ }
    };

    ws.onclose = () => {
      dispatch(setWsConnected(false));
      // Reconexión exponencial
      setTimeout(() => connectWS(), 3000);
    };

    ws.onerror = () => {
      dispatch(setSignalState('lost'));
    };
  }, [dispatch]);

  const subscribeMMSI = useCallback((mmsi) => {
    if (!mmsi || subsRef.current.has(mmsi)) return;
    subsRef.current.add(mmsi);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'subscribe', mmsi }));
    }
  }, []);

  const unsubscribeMMSI = useCallback((mmsi) => {
    subsRef.current.delete(mmsi);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'unsubscribe', mmsi }));
    }
  }, []);

  useEffect(() => {
    connectWS();
    return () => {
      wsRef.current?.close();
    };
  }, [connectWS]);

  // ── CRUD ─────────────────────────────────────────────────────────────────────
  const loadShipments = useCallback(async (params = {}) => {
    dispatch(setLoading(true));
    dispatch(setError(null));
    try {
      const res = await getShipments(params);
      dispatch(setShipments(res.data.data));
      // Suscribir MMSIs de todos los envíos activos
      for (const s of res.data.data.shipments || []) {
        if (s.vesselMmsi) subscribeMMSI(s.vesselMmsi);
      }
    } catch (e) {
      dispatch(setError(e.response?.data?.message || 'Error al cargar envíos'));
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch, subscribeMMSI]);

  const selectShipment = useCallback(async (id) => {
    dispatch(setLoading(true));
    try {
      const res = await getShipmentById(id);
      dispatch(setSelectedShipment(res.data.data));
      if (res.data.data?.vessel?.mmsi) subscribeMMSI(res.data.data.vessel.mmsi);
    } catch (e) {
      dispatch(setError('Error al cargar el envío'));
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch, subscribeMMSI]);

  const closePanel = useCallback(() => dispatch(clearSelected()), [dispatch]);

  const addNewShipment = useCallback(async (data) => {
    const res = await createShipment(data);
    dispatch(addShipment(res.data.data));
    return res.data.data;
  }, [dispatch]);

  const editShipment = useCallback(async (id, data) => {
    await updateShipment(id, data);
    loadShipments();
  }, [loadShipments]);

  const removeShipmentById = useCallback(async (id) => {
    await deleteShipment(id);
    dispatch(removeShipment(id));
  }, [dispatch]);

  const markEvent = useCallback(async (shipmentId, eventCode, isCompleted) => {
    await updateEvent(shipmentId, eventCode, {
      isCompleted,
      occurredAt: isCompleted ? new Date().toISOString() : null,
    });
    if (state.selectedShipment?.id === shipmentId) {
      selectShipment(shipmentId);
    }
  }, [state.selectedShipment, selectShipment]);

  return {
    ...state,
    loadShipments,
    selectShipment,
    closePanel,
    addNewShipment,
    editShipment,
    removeShipmentById,
    markEvent,
    subscribeMMSI,
    unsubscribeMMSI,
  };
}
