const {
  listShipments, getShipmentDetail, createShipment,
  updateShipment, updateEvent, deleteShipment,
} = require('../services/tracking.service');
const { getServiceStatus, getVesselPosition } = require('../services/aisstream.service');
const { Subscription } = require('../models');

async function getPlan(companyId) {
  const sub = await Subscription.findOne({ where: { companyId } });
  return sub?.plan || 'free';
}

const listHandler = async (req, res) => {
  try {
    const { userId, companyId } = req.user;
    const plan   = await getPlan(companyId);
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(50, parseInt(req.query.limit) || 20);
    const status = req.query.status || null;

    const result = await listShipments({ companyId, userId, plan, page, limit, status });
    return res.json({ success: true, data: result });
  } catch (e) {
    console.error('[tracking] list:', e);
    return res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
};

const detailHandler = async (req, res) => {
  try {
    const { companyId } = req.user;
    const { id } = req.params;

    const shipment = await getShipmentDetail(id, companyId);
    if (!shipment) return res.status(404).json({ error: 'NOT_FOUND' });

    return res.json({ success: true, data: shipment });
  } catch (e) {
    console.error('[tracking] detail:', e);
    return res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
};

const createHandler = async (req, res) => {
  try {
    const { userId, companyId } = req.user;
    const shipment = await createShipment({ companyId, userId, data: req.body });
    return res.status(201).json({ success: true, data: shipment });
  } catch (e) {
    console.error('[tracking] create:', e);
    return res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
};

const updateHandler = async (req, res) => {
  try {
    const { companyId } = req.user;
    const { id } = req.params;
    const ok = await updateShipment(id, companyId, req.body);
    if (!ok) return res.status(404).json({ error: 'NOT_FOUND' });
    return res.json({ success: true });
  } catch (e) {
    console.error('[tracking] update:', e);
    return res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
};

const updateEventHandler = async (req, res) => {
  try {
    const { companyId } = req.user;
    const { id, eventCode } = req.params;
    const ok = await updateEvent(id, companyId, eventCode, req.body);
    if (!ok) return res.status(404).json({ error: 'NOT_FOUND' });
    return res.json({ success: true });
  } catch (e) {
    console.error('[tracking] updateEvent:', e);
    return res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
};

const deleteHandler = async (req, res) => {
  try {
    const { companyId } = req.user;
    const { id } = req.params;
    const ok = await deleteShipment(id, companyId);
    if (!ok) return res.status(404).json({ error: 'NOT_FOUND' });
    return res.json({ success: true });
  } catch (e) {
    console.error('[tracking] delete:', e);
    return res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
};

const vesselPositionHandler = async (req, res) => {
  try {
    const { mmsi } = req.params;
    const position = getVesselPosition(mmsi);
    if (!position) return res.status(404).json({ error: 'NO_POSITION', message: 'Sin señal AIS para este buque' });
    return res.json({ success: true, data: position });
  } catch (e) {
    console.error('[tracking] vesselPosition:', e);
    return res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
};

const aisStatusHandler = (_req, res) => {
  return res.json({ success: true, data: getServiceStatus() });
};

module.exports = {
  listHandler,
  detailHandler,
  createHandler,
  updateHandler,
  updateEventHandler,
  deleteHandler,
  vesselPositionHandler,
  aisStatusHandler,
};
