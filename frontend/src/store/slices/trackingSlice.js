import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  shipments:        [],
  selectedShipment: null,
  loading:          false,
  error:            null,
  // AIS en tiempo real
  vesselPositions:  {},  // mmsi → VesselPosition
  signalState:      'connecting', // connecting | live | recent | delayed | estimated | lost | demo
  wsConnected:      false,
  // Paginación
  total:  0,
  page:   1,
  pages:  1,
};

const trackingSlice = createSlice({
  name: 'tracking',
  initialState,
  reducers: {
    setLoading:   (s, a) => { s.loading = a.payload; },
    setError:     (s, a) => { s.error   = a.payload; },
    setShipments: (s, a) => {
      s.shipments = a.payload.shipments;
      s.total     = a.payload.total;
      s.page      = a.payload.page;
      s.pages     = a.payload.pages;
    },
    setSelectedShipment: (s, a) => { s.selectedShipment = a.payload; },
    clearSelected:       (s)    => { s.selectedShipment = null; },
    updateVesselPosition: (s, a) => {
      const { mmsi, position } = a.payload;
      s.vesselPositions[mmsi] = position;
      // Actualizar lat/lng del envío seleccionado si coincide
      if (s.selectedShipment?.vessel?.mmsi === mmsi) {
        s.selectedShipment = {
          ...s.selectedShipment,
          vessel: { ...s.selectedShipment.vessel, ...position },
        };
      }
    },
    setSignalState:  (s, a) => { s.signalState  = a.payload; },
    setWsConnected:  (s, a) => { s.wsConnected  = a.payload; },
    removeShipment:  (s, a) => { s.shipments = s.shipments.filter(sh => sh.id !== a.payload); },
    addShipment:     (s, a) => { s.shipments.unshift(a.payload); },
  },
});

export const {
  setLoading, setError, setShipments, setSelectedShipment, clearSelected,
  updateVesselPosition, setSignalState, setWsConnected, removeShipment, addShipment,
} = trackingSlice.actions;

export default trackingSlice.reducer;
