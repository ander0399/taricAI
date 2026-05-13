import api from './api';

export const getShipments     = (params) => api.get('/tracking', { params });
export const getShipmentById  = (id)     => api.get(`/tracking/${id}`);
export const createShipment   = (data)   => api.post('/tracking', data);
export const updateShipment   = (id, d)  => api.put(`/tracking/${id}`, d);
export const deleteShipment   = (id)     => api.delete(`/tracking/${id}`);
export const updateEvent      = (id, c, d) => api.put(`/tracking/${id}/events/${c}`, d);
export const getVesselPosition = (mmsi)  => api.get(`/tracking/ais/vessel/${mmsi}`);
export const getAisStatus     = ()       => api.get('/tracking/ais/status');
