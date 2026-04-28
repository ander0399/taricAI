/**
 * @description Definición centralizada de límites y capacidades por tier.
 * Fuente única de verdad — cualquier cambio de pricing se hace aquí.
 * Refleja exactamente la tabla de funcionalidades del módulo clasificador.
 */
const TIER_LIMITS = {
  free: {
    clasificacionesMes: 5,
    usuarios: 1,
    // Conteo por usuario individual (no por empresa)
    countByUser: true,
    mirror: false,
    nonTariffBarriers: false,
    scoring: false,
    alertasRiesgo: false,
    ocr: false,
    pdfExport: false,
    sharedClassifications: false,
    apiAccess: false,
  },
  pro: {
    clasificacionesMes: 50,
    usuarios: 1,
    countByUser: true,
    mirror: true,
    nonTariffBarriers: true,
    scoring: true,
    alertasRiesgo: true,
    ocr: true,
    pdfExport: true,
    sharedClassifications: false,
    apiAccess: false,
  },
  team: {
    clasificacionesMes: 2000,
    usuarios: 15,
    // Conteo compartido entre toda la empresa
    countByUser: false,
    mirror: true,
    nonTariffBarriers: true,
    scoring: true,
    alertasRiesgo: true,
    ocr: true,
    pdfExport: true,
    sharedClassifications: true,
    apiAccess: false,
  },
  enterprise: {
    clasificacionesMes: Infinity,
    usuarios: Infinity,
    countByUser: false,
    mirror: true,
    nonTariffBarriers: true,
    scoring: true,
    alertasRiesgo: true,
    ocr: true,
    pdfExport: true,
    sharedClassifications: true,
    apiAccess: true,
  },
};

module.exports = TIER_LIMITS;
