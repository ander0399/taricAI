const { isFalsePositivePair, lookupKnownAgreement } = require('../utils/known.agreements');

/**
 * @description Valida la respuesta de la IA sobre acuerdos comerciales.
 *              Corrige falsos positivos conocidos (acuerdos inventados) y marca
 *              acuerdos desconocidos como no verificados para que el frontend
 *              muestre la advertencia apropiada.
 *
 * @param {Object} tradeAgreements - Objeto tradeAgreements de la respuesta de IA
 * @param {string} exporterCode    - ISO alpha-3 del país exportador
 * @param {string} importerCode    - ISO alpha-3 del país importador
 * @returns {Object} tradeAgreements validado y corregido, con campo _validated: true
 * @throws {400} Si tradeAgreements es null o no tiene estructura esperada
 */
function validateTradeAgreements(tradeAgreements, exporterCode, importerCode) {
  if (!tradeAgreements || typeof tradeAgreements !== 'object') {
    return {
      hasPreferentialAgreement: false,
      agreementName:   null,
      agreementStatus: null,
      preferentialRate: null,
      rulesOfOrigin:   null,
      proofOfOriginRequired: null,
      validationSource: 'WTO RTA Database / Access2Markets',
      validationNote:  'No se pudo validar el acuerdo — estructura de respuesta inválida.',
      _validated:      true,
      _corrected:      true,
    };
  }

  // Si la IA NO reportó acuerdo → verificar si existe uno en la base de conocimiento
  if (!tradeAgreements.hasPreferentialAgreement) {
    const known = lookupKnownAgreement(exporterCode, importerCode);
    if (known && known.status === 'vigente') {
      return {
        ...tradeAgreements,
        hasPreferentialAgreement: true,
        agreementName:   known.agreementName,
        agreementStatus: known.status,
        validationNote:  `Acuerdo encontrado en base de datos verificada: ${known.agreementName}. La IA no lo detectó — verificar en fuente oficial.`,
        _validated:  true,
        _corrected:  true,
        _aiMissed:   true,
      };
    }
    return { ...tradeAgreements, _validated: true };
  }

  // La IA reportó un acuerdo → verificar que no sea falso positivo
  if (isFalsePositivePair(exporterCode, importerCode)) {
    return {
      ...tradeAgreements,
      hasPreferentialAgreement: false,
      agreementName:    null,
      agreementStatus:  null,
      preferentialRate: null,
      validationNote:   `Acuerdo corregido: la IA reportó "${tradeAgreements.agreementName}" pero NO existe acuerdo preferencial vigente entre ${exporterCode} y ${importerCode} a 2026. Se aplica tasa NMF.`,
      _validated: true,
      _corrected: true,
      _originalAiClaim: tradeAgreements.agreementName,
    };
  }

  // Verificar si el acuerdo reportado por la IA está en la base de conocimiento
  const known = lookupKnownAgreement(exporterCode, importerCode);
  if (!known) {
    // Acuerdo desconocido — marcarlo como no verificado para que el frontend muestre advertencia
    return {
      ...tradeAgreements,
      _validated:    true,
      _unverified:   true,
      validationNote: `Acuerdo "${tradeAgreements.agreementName}" reportado por IA — no encontrado en base de datos local. ⚠️ Verificar en WTO RTA Database antes de usar tasa preferencial.`,
    };
  }

  // Acuerdo confirmado en la base de datos
  if (known.status !== 'vigente') {
    return {
      ...tradeAgreements,
      agreementStatus: known.status,
      validationNote:  known.note || `Acuerdo "${known.agreementName}" existe pero estado: ${known.status}. Verificar vigencia antes de aplicar tasa preferencial.`,
      _validated: true,
      _statusWarning: true,
    };
  }

  return { ...tradeAgreements, agreementStatus: known.status, _validated: true };
}

/**
 * @description Propaga la corrección de tradeAgreements a rulesOfOrigin para mantener
 *              consistencia interna entre ambos objetos (Sección 7.2 — REGLA DE CONSISTENCIA).
 * @param {Object} tradeAgreements - Ya validado
 * @param {Object|null} rulesOfOrigin - Del mirrorAnalysis
 * @returns {Object|null} rulesOfOrigin corregido
 */
function syncRulesOfOrigin(tradeAgreements, rulesOfOrigin) {
  if (!rulesOfOrigin) return null;
  if (!tradeAgreements.hasPreferentialAgreement) {
    return {
      ...rulesOfOrigin,
      agreementApplies:  false,
      agreementName:     null,
      preferentialRate:  null,
      originCriteria:    null,
      proofOfOrigin:     null,
    };
  }
  return {
    ...rulesOfOrigin,
    agreementApplies: true,
    agreementName:    tradeAgreements.agreementName,
    preferentialRate: tradeAgreements.preferentialRate,
  };
}

module.exports = { validateTradeAgreements, syncRulesOfOrigin };
