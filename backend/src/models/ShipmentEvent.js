const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Los 19 eventos del ciclo de vida naviera-grade
const EVENT_CODES = [
  'EVT-01', 'EVT-02', 'EVT-03', 'EVT-04', 'EVT-05',
  'EVT-06', 'EVT-07', 'EVT-08', 'EVT-09', 'EVT-10',
  'EVT-11', 'EVT-12', 'EVT-13', 'EVT-14', 'EVT-15',
  'EVT-16', 'EVT-17', 'EVT-18', 'EVT-19',
];

const ShipmentEvent = sequelize.define('ShipmentEvent', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  shipmentId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  code: {
    type: DataTypes.ENUM(...EVENT_CODES),
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  isCompleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  occurredAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'null si el evento aún no ha ocurrido',
  },
  estimatedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'ETA estimada del evento futuro',
  },
  source: {
    type: DataTypes.ENUM('internal', 'carrier_api', 'aisstream', 'manual'),
    defaultValue: 'internal',
  },
  locationLocode: {
    type: DataTypes.STRING(10),
    allowNull: true,
  },
  locationName: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'shipment_events',
  timestamps: true,
  indexes: [
    { fields: ['shipmentId'] },
    { fields: ['code'] },
    { unique: true, fields: ['shipmentId', 'code'] },
  ],
});

module.exports = ShipmentEvent;
