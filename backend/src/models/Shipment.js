const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Shipment = sequelize.define('Shipment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  companyId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },

  // ── Identificación del envío ─────────────────────────────────────────
  reference: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  transportMode: {
    type: DataTypes.ENUM('sea', 'air', 'multimodal'),
    defaultValue: 'sea',
  },

  // ── Contenedor ───────────────────────────────────────────────────────
  containerNumber: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  containerType: {
    type: DataTypes.STRING(10),
    allowNull: true,
    comment: '20GP, 40GP, 40HC, 20RF, 40RF, 45RH',
  },
  sealNumber: {
    type: DataTypes.STRING(30),
    allowNull: true,
  },
  grossWeightKg: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  volumeM3: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  blNumber: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  bookingNumber: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  incoterm: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },

  // ── Buque y naviera ──────────────────────────────────────────────────
  carrierName: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  vesselName: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  vesselImo: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  vesselMmsi: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: 'MMSI para suscripción en AISStream.io',
  },
  voyageNumber: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  serviceCode: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: 'Código de servicio naviero ej: WCSA',
  },
  allianceName: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '2M Alliance, Ocean Alliance, THE Alliance',
  },

  // ── Ruta (JSON con array de puertos) ────────────────────────────────
  routeJson: {
    type: DataTypes.JSONB,
    defaultValue: [],
    comment: 'Array de { locode, name, lat, lng, type, eta, ata, isCompleted }',
  },

  // ── Progreso y estado ────────────────────────────────────────────────
  status: {
    type: DataTypes.ENUM(
      'booking_confirmed', 'at_origin_terminal', 'on_board',
      'in_transit_sea', 'at_transshipment', 'in_transit_sea_leg2',
      'at_destination_anchorage', 'berthed_at_destination',
      'discharged', 'customs_process', 'available_pickup',
      'in_transit_land', 'delivered', 'rollover_detected',
    ),
    defaultValue: 'booking_confirmed',
  },
  progressPercent: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },

  // ── ETAs ────────────────────────────────────────────────────────────
  etaPort: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'ETA área del puerto destino',
  },
  etaBerth: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'ETA atraque en berth (puede ser +6-48h después de etaPort)',
  },
  etaDischarge: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  etaGateOut: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  etaConfidence: {
    type: DataTypes.ENUM('high', 'medium', 'low'),
    defaultValue: 'medium',
  },
  etaSource: {
    type: DataTypes.STRING(50),
    defaultValue: 'internal',
    comment: 'carrier_api, aisstream, internal, captain',
  },

  // ── Detention & Demurrage ────────────────────────────────────────────
  dndFreeDays: {
    type: DataTypes.INTEGER,
    defaultValue: 7,
  },
  dndFreeDaysUnit: {
    type: DataTypes.ENUM('calendar', 'working'),
    defaultValue: 'calendar',
  },
  dndCountStartsAt: {
    type: DataTypes.ENUM('discharge', 'gate_out', 'arrival'),
    defaultValue: 'discharge',
  },
  dndDailyRateUsd: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  dndAlertConfigured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },

  // ── Reefer (solo para contenedores refrigerados) ─────────────────────
  reeferSetpointC: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  reeferCurrentTempC: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  reeferLastReadingAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },

  // ── Datos de posición AIS (caché de última posición conocida) ────────
  vesselLat: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  vesselLng: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  vesselSog: {
    type: DataTypes.FLOAT,
    allowNull: true,
    comment: 'Speed Over Ground en nudos',
  },
  vesselCog: {
    type: DataTypes.FLOAT,
    allowNull: true,
    comment: 'Course Over Ground en grados',
  },
  vesselHeading: {
    type: DataTypes.FLOAT,
    allowNull: true,
    comment: 'TrueHeading normalizado (nunca 511)',
  },
  vesselNavStatus: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'AIS NavigationalStatus 0-15',
  },
  vesselLastSignalAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  vesselAisSource: {
    type: DataTypes.STRING(30),
    defaultValue: 'demo',
    comment: 'aisstream_live, fallback_rest, projected, demo',
  },

  // ── Huella de carbono ────────────────────────────────────────────────
  co2TonEstimate: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },

  // ── Alertas activas (JSON array) ─────────────────────────────────────
  activeAlertsJson: {
    type: DataTypes.JSONB,
    defaultValue: [],
  },

  // ── Metadatos ────────────────────────────────────────────────────────
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'shipments',
  timestamps: true,
  indexes: [
    { fields: ['companyId'] },
    { fields: ['vesselMmsi'] },
    { fields: ['status'] },
    { fields: ['isActive'] },
  ],
});

module.exports = Shipment;
