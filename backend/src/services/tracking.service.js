const { Shipment, ShipmentEvent } = require('../models');
const { getVesselPosition, getSignalState, calcSignalAge } = require('./aisstream.service');

const EVENT_NAMES = {
  'EVT-01': 'Booking confirmado',
  'EVT-02': 'Cut-off documentación',
  'EVT-03': 'Cut-off VGM',
  'EVT-04': 'Cut-off entrega físico (gate-in)',
  'EVT-05': 'Gate-in terminal de origen',
  'EVT-06': 'VGM confirmado (SOLAS)',
  'EVT-07': 'Cargado en buque (On Board)',
  'EVT-08': 'Zarpe confirmado',
  'EVT-09': 'Paso por punto estratégico',
  'EVT-10': 'Llegada a hub / transshipment',
  'EVT-11': 'Descarga en hub',
  'EVT-12': 'Rollover detectado',
  'EVT-13': 'Carga en buque de conexión',
  'EVT-14': 'Zarpe buque de conexión',
  'EVT-15': 'ETA área puerto destino',
  'EVT-16': 'Atracada en berth (muelle)',
  'EVT-17': 'Descarga en destino',
  'EVT-18': 'Gate-out / contenedor libre',
  'EVT-19': 'Entregado en bodega del cliente',
};

/**
 * @description Crea los 19 eventos del ciclo de vida para un envío nuevo.
 * El primer evento (booking) se marca como completado de inmediato.
 */
async function createDefaultEvents(shipmentId, bookingDate) {
  const events = Object.entries(EVENT_NAMES).map(([code, name], idx) => ({
    shipmentId,
    code,
    name,
    isCompleted: idx === 0, // Solo EVT-01 completed al crear
    occurredAt:  idx === 0 ? (bookingDate || new Date()) : null,
    source:      'internal',
  }));

  await ShipmentEvent.bulkCreate(events, { ignoreDuplicates: true });
}

/**
 * @description Calcula D&D status a partir de los datos del envío.
 */
function calcDndStatus(shipment) {
  const { dndFreeDays, dndFreeDaysUnit, etaDischarge, dndDailyRateUsd } = shipment;
  if (!etaDischarge) return null;

  const now = Date.now();
  const dischargeMs = new Date(etaDischarge).getTime();

  // Si el descargue aún no ha ocurrido, usar ETA como referencia
  const countStartMs = dischargeMs > now ? dischargeMs : now;

  // Calcular vencimiento (simplificado: calendario = días corridos)
  const expiryMs = countStartMs + dndFreeDays * 86_400_000;
  const daysRemaining = Math.ceil((expiryMs - now) / 86_400_000);

  let status;
  if (daysRemaining > 7)       status = 'safe';
  else if (daysRemaining > 3)  status = 'warning';
  else if (daysRemaining > 0)  status = 'urgent';
  else                          status = 'expired';

  const daysInDemurrage = status === 'expired' ? Math.abs(daysRemaining) : 0;

  return {
    freeDaysGranted: dndFreeDays,
    freeDaysUnit: dndFreeDaysUnit,
    estimatedExpiry: new Date(expiryMs).toISOString(),
    daysRemaining: Math.max(daysRemaining, 0),
    status,
    daysInDemurrage,
    estimatedCostUsd: daysInDemurrage > 0 && dndDailyRateUsd
      ? daysInDemurrage * dndDailyRateUsd
      : null,
  };
}

/**
 * @description Enriquece el payload del envío con datos AIS en tiempo real.
 */
function enrichWithAIS(shipment) {
  if (!shipment.vesselMmsi) return shipment;

  const livePos = getVesselPosition(shipment.vesselMmsi);
  if (!livePos) return shipment;

  const ageMinutes = livePos.signalAgeMinutes ?? calcSignalAge(livePos.timestamp);

  return {
    ...shipment,
    vessel: {
      ...shipment.vessel,
      lat:              livePos.lat,
      lng:              livePos.lng,
      sog:              livePos.sog,
      cog:              livePos.cog,
      heading:          livePos.heading,
      navStatus:        livePos.navStatus,
      navStatusCode:    livePos.navStatusCode,
      signalState:      getSignalState(ageMinutes),
      signalAgeMinutes: ageMinutes,
      lastSignalUtc:    livePos.timestamp,
      aisSource:        livePos.source,
    },
  };
}

// ── CRUD público ──────────────────────────────────────────────────────────────

async function listShipments({ companyId, userId, plan, page = 1, limit = 20, status }) {
  const where = { companyId, isActive: true };
  if (status) where.status = status;

  // Free plan: solo envíos del usuario. Pro+: todos de la empresa.
  if (!['pro', 'team', 'enterprise'].includes(plan)) {
    where.userId = userId;
  }

  const offset = (page - 1) * limit;
  const { rows, count } = await Shipment.findAndCountAll({
    where,
    limit,
    offset,
    order: [['createdAt', 'DESC']],
  });

  return {
    shipments: rows.map(s => buildShipmentSummary(s)),
    total: count,
    page,
    pages: Math.ceil(count / limit),
  };
}

async function getShipmentDetail(shipmentId, companyId) {
  const shipment = await Shipment.findOne({
    where: { id: shipmentId, companyId, isActive: true },
    include: [{ association: 'eventos', order: [['code', 'ASC']] }],
  });
  if (!shipment) return null;

  const raw = shipment.toJSON();
  const dnd = calcDndStatus(raw);

  return {
    ...buildShipmentDetail(raw),
    dnd,
    events: raw.eventos || [],
  };
}

async function createShipment({ companyId, userId, data }) {
  const shipment = await Shipment.create({
    companyId,
    userId,
    ...data,
  });

  await createDefaultEvents(shipment.id, shipment.createdAt);
  return buildShipmentSummary(shipment.toJSON());
}

async function updateShipment(shipmentId, companyId, data) {
  const [updated] = await Shipment.update(data, {
    where: { id: shipmentId, companyId },
  });
  return updated > 0;
}

async function updateEvent(shipmentId, companyId, eventCode, data) {
  const shipment = await Shipment.findOne({ where: { id: shipmentId, companyId } });
  if (!shipment) return false;

  const [updated] = await ShipmentEvent.update(data, {
    where: { shipmentId, code: eventCode },
  });
  return updated > 0;
}

async function deleteShipment(shipmentId, companyId) {
  const [updated] = await Shipment.update({ isActive: false }, {
    where: { id: shipmentId, companyId },
  });
  return updated > 0;
}

// ── Helpers de construcción de payload ───────────────────────────────────────

function buildShipmentSummary(raw) {
  const ageMinutes = raw.vesselLastSignalAt ? calcSignalAge(raw.vesselLastSignalAt) : 999;
  const signalState = raw.vesselAisSource === 'demo' ? 'live' : getSignalState(ageMinutes);
  const dnd = calcDndStatus(raw);

  return {
    id:              raw.id,
    reference:       raw.reference,
    containerNumber: raw.containerNumber,
    carrierName:     raw.carrierName,
    vesselName:      raw.vesselName,
    vesselMmsi:      raw.vesselMmsi,
    status:          raw.status,
    progressPercent: raw.progressPercent,
    etaPort:         raw.etaPort,
    transportMode:   raw.transportMode,
    activeAlerts:    raw.activeAlertsJson || [],
    dndStatus:       dnd?.status || 'safe',
    dndDaysRemaining: dnd?.daysRemaining ?? null,
    signalState,
    vesselLat:       raw.vesselLat,
    vesselLng:       raw.vesselLng,
    createdAt:       raw.createdAt,
  };
}

function buildShipmentDetail(raw) {
  const ageMinutes = raw.vesselLastSignalAt ? calcSignalAge(raw.vesselLastSignalAt) : 999;
  const signalState = raw.vesselAisSource === 'demo' ? 'live' : getSignalState(ageMinutes);

  return {
    id:              raw.id,
    reference:       raw.reference,
    transportMode:   raw.transportMode,
    container: {
      number:       raw.containerNumber,
      type:         raw.containerType,
      sealNumber:   raw.sealNumber,
      grossWeightKg: raw.grossWeightKg,
      volumeM3:     raw.volumeM3,
    },
    booking: {
      blNumber:     raw.blNumber,
      bookingNumber: raw.bookingNumber,
      incoterm:     raw.incoterm,
    },
    carrier: {
      name:         raw.carrierName,
      vesselName:   raw.vesselName,
      vesselImo:    raw.vesselImo,
      voyageNumber: raw.voyageNumber,
      serviceCode:  raw.serviceCode,
      allianceName: raw.allianceName,
    },
    vessel: {
      mmsi:             raw.vesselMmsi,
      name:             raw.vesselName,
      lat:              raw.vesselLat,
      lng:              raw.vesselLng,
      sog:              raw.vesselSog,
      cog:              raw.vesselCog,
      heading:          raw.vesselHeading,
      navStatusCode:    raw.vesselNavStatus,
      signalState,
      signalAgeMinutes: ageMinutes,
      lastSignalUtc:    raw.vesselLastSignalAt,
      aisSource:        raw.vesselAisSource,
    },
    route:          raw.routeJson || [],
    status:         raw.status,
    progressPercent: raw.progressPercent,
    eta: {
      port:         raw.etaPort,
      berth:        raw.etaBerth,
      discharge:    raw.etaDischarge,
      gateOut:      raw.etaGateOut,
      confidence:   raw.etaConfidence,
      source:       raw.etaSource,
    },
    dnd: {
      freeDays:         raw.dndFreeDays,
      freeDaysUnit:     raw.dndFreeDaysUnit,
      countStartsAt:    raw.dndCountStartsAt,
      dailyRateUsd:     raw.dndDailyRateUsd,
      alertConfigured:  raw.dndAlertConfigured,
    },
    reefer: raw.reeferSetpointC != null ? {
      setpointC:    raw.reeferSetpointC,
      currentTempC: raw.reeferCurrentTempC,
      lastReadingAt: raw.reeferLastReadingAt,
    } : null,
    co2TonEstimate: raw.co2TonEstimate,
    activeAlerts:   raw.activeAlertsJson || [],
    notes:          raw.notes,
    createdAt:      raw.createdAt,
    updatedAt:      raw.updatedAt,
  };
}

module.exports = {
  listShipments,
  getShipmentDetail,
  createShipment,
  updateShipment,
  updateEvent,
  deleteShipment,
  calcDndStatus,
  enrichWithAIS,
};
