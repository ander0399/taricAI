/**
 * @description Helpers de fechas para el seed de datos de prueba.
 * Usar fechas dinámicas (calculadas en runtime) evita que el seed quede
 * con períodos expirados conforme pasa el tiempo.
 */

/**
 * @description Primer y último día del mes actual en UTC.
 * Usado para empresas con suscripción activa (GlobalTrade, ComerExport, Nexus).
 *
 * @returns {{ start: Date, end: Date }}
 */
function getPeriodDates() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0));
  const end   = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59));
  return { start, end };
}

/**
 * @description Período ya vencido: mes anterior, con end = hace 5 días.
 * Usado para simular Adriatica Imports EU con stripeStatus: 'past_due'.
 * El período terminó hace 5 días, dejando al tenant sin acceso a nuevas clasificaciones.
 *
 * @returns {{ start: Date, end: Date }}
 */
function getExpiredPeriodDates() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1, 0, 0, 0));
  // end = hace 5 días — simula que el período venció recientemente
  const end = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
  return { start, end };
}

/**
 * @description Fecha de fin de período enterprise a 6 meses desde hoy.
 * Nexus Enterprise Corp tiene contrato semianual.
 *
 * @returns {Date}
 */
function getAnnualPeriodEnd() {
  const now = new Date();
  return new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth() + 6,
    now.getUTCDate(),
    23, 59, 59
  ));
}

/**
 * @description Genera un timestamp dentro del período vencido de Adriatica.
 * Usado para que las clasificaciones de Adriatica tengan createdAt coherente
 * con cuando el plan aún estaba activo.
 *
 * @param {number} offsetDays - Días desde el inicio del período (0-25)
 * @returns {Date}
 */
function getAdriatikaClassificationDate(offsetDays = 0) {
  const { start } = getExpiredPeriodDates();
  return new Date(start.getTime() + offsetDays * 24 * 60 * 60 * 1000);
}

module.exports = { getPeriodDates, getExpiredPeriodDates, getAnnualPeriodEnd, getAdriatikaClassificationDate };
