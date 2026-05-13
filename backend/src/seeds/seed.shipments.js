const { Shipment, ShipmentEvent, User } = require('../models');

const DEMO_COMPANY_ID = 'c1000000-0000-0000-0000-000000000001';
const DEMO_USER_ID    = 'a1000000-0000-0000-0000-000000000001';
const SEED_ID         = 'sh000001-0000-0000-0000-000000000001';

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

async function seedShipments() {
  const userExists = await User.findByPk(DEMO_USER_ID);
  if (!userExists) {
    console.log('[seed.shipments] Usuario demo no encontrado — omitiendo seed de envíos');
    return;
  }

  const existing = await Shipment.findByPk(SEED_ID);
  if (existing) {
    console.log('[seed.shipments] Envío demo ya existe — omitiendo');
    return;
  }

  const now = new Date();
  const etaPort = new Date(now.getTime() + 2 * 86_400_000); // +2 días
  const etaDischarge = new Date(now.getTime() + 3 * 86_400_000);

  const shipment = await Shipment.create({
    id: SEED_ID,
    companyId: DEMO_COMPANY_ID,
    userId: DEMO_USER_ID,
    reference: 'REF-2026-001',
    transportMode: 'sea',
    containerNumber: 'MSCU7234891',
    containerType: '40HC',
    sealNumber: '3847291',
    grossWeightKg: 18400,
    volumeM3: 67.3,
    blNumber: 'MSC-BL-2026-04-0047',
    bookingNumber: 'MSCBOG0123456',
    incoterm: 'CIF COBUN',
    carrierName: 'MSC',
    vesselName: 'MSC BEATRICE',
    vesselImo: '9812345',
    vesselMmsi: '636017046',
    voyageNumber: '625W',
    serviceCode: 'WCSA',
    allianceName: '2M Alliance',
    routeJson: [
      { locode: 'CNYTN', name: 'Yantian (Shenzhen)', lat: 22.555, lng: 114.250, type: 'origin',        isCompleted: true,  eta: '2026-05-05T01:15:00Z', ata: '2026-05-05T01:15:00Z' },
      { locode: 'PABLB', name: 'Puerto Balboa',       lat: 8.968,  lng: -79.531, type: 'transshipment', isCompleted: false, eta: etaPort.toISOString() },
      { locode: 'COBUN', name: 'Buenaventura',        lat: 3.876,  lng: -77.073, type: 'destination',   isCompleted: false, eta: etaDischarge.toISOString() },
    ],
    status: 'in_transit_sea',
    progressPercent: 62,
    etaPort,
    etaBerth: new Date(etaPort.getTime() + 8 * 3600_000),
    etaDischarge,
    etaGateOut: new Date(etaDischarge.getTime() + 86_400_000),
    etaConfidence: 'high',
    etaSource: 'carrier_api',
    dndFreeDays: 7,
    dndFreeDaysUnit: 'calendar',
    dndCountStartsAt: 'discharge',
    dndDailyRateUsd: 150,
    vesselLat: 8.705,
    vesselLng: -79.531,
    vesselSog: 18.4,
    vesselCog: 187,
    vesselHeading: 185,
    vesselNavStatus: 0,
    vesselLastSignalAt: now,
    vesselAisSource: 'demo',
    co2TonEstimate: 2.3,
    activeAlertsJson: [],
    isActive: true,
  });

  // Crear eventos del ciclo de vida
  const completedEvents = ['EVT-01', 'EVT-02', 'EVT-03', 'EVT-04', 'EVT-05', 'EVT-06', 'EVT-07', 'EVT-08'];
  const events = Object.entries(EVENT_NAMES).map(([code, name]) => {
    const isCompleted = completedEvents.includes(code);
    const daysOffset = completedEvents.indexOf(code);
    return {
      shipmentId:   shipment.id,
      code,
      name,
      isCompleted,
      occurredAt:   isCompleted ? new Date(now.getTime() - (completedEvents.length - daysOffset) * 86_400_000) : null,
      estimatedAt:  !isCompleted ? new Date(etaPort.getTime() + completedEvents.indexOf(code) * 86_400_000) : null,
      source:       isCompleted ? 'carrier_api' : 'internal',
      locationLocode: code === 'EVT-08' ? 'CNYTN' : (code === 'EVT-10' ? 'PABLB' : null),
      locationName:   code === 'EVT-08' ? 'Yantian' : (code === 'EVT-10' ? 'Balboa' : null),
    };
  });

  await ShipmentEvent.bulkCreate(events, { ignoreDuplicates: true });
  console.log('[seed.shipments] Envío demo MSC BEATRICE creado correctamente.');
}

module.exports = { seedShipments };
