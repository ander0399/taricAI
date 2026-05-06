const OpenAI = require('openai');
const { CountryRiskProfiles, RiskUpdateLogs, sequelize } = require('../models');

// Cliente independiente del openai.service.js del clasificador — misma API key, distinto flujo
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── SISTEMA DE PROMPTS ───────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Eres el Motor de Inteligencia de Riesgo Logístico-Aduanero de Taric AI.
Tu misión es evaluar el riesgo actual de comercio exterior con un país específico.
USA web_search para obtener información de las últimas 24-48 horas. Busca noticias
sobre: aranceles, sanciones, huelgas portuarias o de transporte, conflictos activos,
cambios regulatorios aduaneros, restricciones de divisas, desastres naturales en rutas
de comercio, y cualquier evento geopolítico que afecte el flujo de mercancías.
Evalúa con rigor y objetividad. Cuando el país tenga pocas noticias recientes,
mantén el score cercano al histórico registrado.
Devuelve EXCLUSIVAMENTE un objeto JSON válido. Sin texto antes ni después. Sin markdown.`;

// ─── BUILDERS ────────────────────────────────────────────────────────────────

/**
 * @description Construye los prompts del template para GPT-4o, sustituyendo todos
 * los placeholders con datos reales del perfil actual del país.
 * countryName (inglés) se usa aquí — mejor rendimiento de web_search en inglés.
 * @param {Object} countryProfile - Registro actual de CountryRiskProfiles
 * @returns {{ systemPrompt: string, userPrompt: string }}
 */
function buildCountryAnalysisPrompt(countryProfile) {
  const currentDateUtc = new Date().toISOString().slice(0, 10);

  const userPrompt = `Fecha actual (UTC): ${currentDateUtc}
País a evaluar: ${countryProfile.countryName} (${countryProfile.isoAlpha3})
Último TRS registrado: ${countryProfile.trsOverall} / 10.0

Evalúa los 4 pilares del TARIC RISK SCORE (TRS) para este país HOY.
Escala: 1.0 = riesgo mínimo, 10.0 = riesgo crítico/bloqueante.

PILAR 1 — EFICIENCIA ADUANERA (peso 30%): busca huelgas de aduana, nuevos requisitos
documentales, cambios en canales de inspección, noticias de VUCE o sistema aduanero.

PILAR 2 — FLUIDEZ LOGÍSTICA (peso 30%): busca huelgas portuarias o de camioneros,
congestión en puertos principales, cortes de rutas, desastres en infraestructura.

PILAR 3 — SEGURIDAD NORMATIVA (peso 20%): busca nuevos aranceles, licencias de importación,
restricciones de divisas, medidas no arancelarias publicadas en los últimos 30 días.

PILAR 4 — RIESGO GEOPOLÍTICO (peso 20%): busca sanciones OFAC/ONU/UE activas, conflictos
armados, inestabilidad política severa, embargos comerciales.

Responde SOLO con este JSON (reemplaza los valores, no dejes placeholders):
{
  "isoAlpha3": "${countryProfile.isoAlpha3}",
  "trsAduanero": 0.0,
  "trsLogistico": 0.0,
  "trsNormativo": 0.0,
  "trsGeopolitico": 0.0,
  "trend": "improving|stable|deteriorating",
  "criticalInsight": "Análisis del factor de mayor impacto hoy en máximo 220 caracteres.",
  "localSourceAlert": "Noticia o alerta de fuente oficial local en máximo 220 caracteres.",
  "proRecommendation": "Consejo táctico específico para exportadores/importadores en máximo 220 caracteres.",
  "sources": ["Fuente verificable 1", "Fuente verificable 2", "Fuente verificable 3"],
  "changesDetected": true,
  "changesSummary": "Resumen de qué cambió vs. análisis anterior en máximo 180 caracteres o null si no hay cambios."
}`;

  return { systemPrompt: SYSTEM_PROMPT, userPrompt };
}

// ─── LLAMADA A GPT-4o CON WEB_SEARCH ─────────────────────────────────────────

/**
 * @description Ejecuta la llamada a GPT-4o via Responses API con web_search habilitado.
 * Usa backoff fijo de RISK_MAP_RETRY_DELAY_MS (60s) ante rate limit 429.
 * Errores 5xx no se reintentan — se registran y el país queda en cola de error.
 * @param {{ systemPrompt: string, userPrompt: string }} promptObj
 * @returns {Promise<{ text: string, tokensUsed: number, processingMs: number }>}
 * @throws {Error} Si falla después de MAX_RETRIES intentos o el error no es recuperable
 */
async function callGPT4oWithWebSearch({ systemPrompt, userPrompt }) {
  const maxRetries = parseInt(process.env.RISK_MAP_MAX_RETRIES, 10) || 2;
  const retryDelayMs = parseInt(process.env.RISK_MAP_RETRY_DELAY_MS, 10) || 60000;
  const maxTokens = parseInt(process.env.RISK_MAP_MAX_TOKENS, 10) || 1000;
  const model = process.env.RISK_MAP_AI_MODEL || 'gpt-4o';

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    const t0 = Date.now();
    try {
      const response = await client.responses.create({
        model,
        instructions: systemPrompt,
        input: userPrompt,
        tools: [{ type: 'web_search_20250305' }],
        max_output_tokens: maxTokens,
      });

      const processingMs = Date.now() - t0;
      const text = response.output_text || '';
      const tokensUsed = response.usage?.total_tokens || 0;

      return { text, tokensUsed, processingMs };
    } catch (err) {
      const isRateLimit = err?.status === 429 || err?.code === 'rate_limit_exceeded';
      const isRetryable = isRateLimit;

      if (!isRetryable || attempt > maxRetries) {
        // Errores 5xx o agotamiento de reintentos: propagar para registrar en RiskUpdateLogs
        throw err;
      }

      console.warn(
        `[riskMapAI] Rate limit en ${err?.status}. Esperando ${retryDelayMs / 1000}s antes de reintentar (${attempt}/${maxRetries})...`
      );
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
    }
  }
}

// ─── VALIDACIÓN Y SANITIZACIÓN ────────────────────────────────────────────────

/**
 * @description Valida, clampea y enriquece el JSON devuelto por GPT-4o.
 * Calcula trsOverall y riskLevel server-side — nunca se confía en los valores de GPT.
 * Si el JSON es irrecuperable, lanza JSON_PARSE_FAILED para activar el fallback.
 * @param {string} rawGptResponse - Texto crudo de GPT-4o (puede incluir backticks o texto)
 * @param {Object} previousProfile - Perfil anterior en DB (para fallback si GPT falla)
 * @returns {Object} JSON validado y enriquecido listo para persistir
 * @throws {Error} code='JSON_PARSE_FAILED' si el JSON es irrecuperable
 */
function validateAndSanitizeTRS(rawGptResponse, previousProfile) {
  // GPT-4o a veces envuelve el JSON en backticks o añade texto previo
  const cleanJson = rawGptResponse
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  // Extraer el bloque JSON si hay texto antes o después
  const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
  const jsonStr = jsonMatch ? jsonMatch[0] : cleanJson;

  let parsed;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (e) {
    throw Object.assign(new Error(`JSON_PARSE_FAILED: ${e.message}`), { code: 'JSON_PARSE_FAILED' });
  }

  // Clampear todos los scores al rango válido 1.0–10.0
  const clamp = (val) => Math.min(10.0, Math.max(1.0, parseFloat(val) || 5.0));

  const sanitized = {
    isoAlpha3:         String(parsed.isoAlpha3 || previousProfile.isoAlpha3),
    trsAduanero:       clamp(parsed.trsAduanero),
    trsLogistico:      clamp(parsed.trsLogistico),
    trsNormativo:      clamp(parsed.trsNormativo),
    trsGeopolitico:    clamp(parsed.trsGeopolitico),
    trend:             ['improving', 'stable', 'deteriorating'].includes(parsed.trend)
                         ? parsed.trend : 'stable',
    criticalInsight:   parsed.criticalInsight   ? String(parsed.criticalInsight).slice(0, 250)   : null,
    localSourceAlert:  parsed.localSourceAlert  ? String(parsed.localSourceAlert).slice(0, 250)  : null,
    proRecommendation: parsed.proRecommendation ? String(parsed.proRecommendation).slice(0, 250) : null,
    sources:           Array.isArray(parsed.sources) ? parsed.sources.slice(0, 5) : [],
    changesDetected:   Boolean(parsed.changesDetected),
    changesSummary:    parsed.changesSummary ? String(parsed.changesSummary).slice(0, 200) : null,
  };

  // trsOverall y riskLevel se calculan SIEMPRE server-side — invariante del módulo
  sanitized.trsOverall = parseFloat(
    (
      sanitized.trsAduanero    * 0.30 +
      sanitized.trsLogistico   * 0.30 +
      sanitized.trsNormativo   * 0.20 +
      sanitized.trsGeopolitico * 0.20
    ).toFixed(2)
  );

  sanitized.riskLevel =
    sanitized.trsOverall < 3.0 ? 'low'
    : sanitized.trsOverall < 5.0 ? 'medium'
    : sanitized.trsOverall < 7.0 ? 'high'
    : 'critical';

  return sanitized;
}

// ─── PERSISTENCIA ─────────────────────────────────────────────────────────────

/**
 * @description Persiste el perfil TRS validado en CountryRiskProfiles y crea un registro
 * en RiskUpdateLogs. Usa transacción Sequelize para garantizar atomicidad.
 * Si un paso falla, ambos registros se revierten — no quedan estados inconsistentes.
 * @param {Object} validatedProfile - Salida de validateAndSanitizeTRS
 * @param {Object} previousProfile - Registro anterior en CountryRiskProfiles
 * @param {'cron'|'manual'|'test'} triggeredBy
 * @param {number} tokensUsed - Tokens consumidos en la llamada a GPT-4o
 * @param {number} processingMs - Duración total de la llamada en ms
 * @returns {Promise<Object>} Perfil actualizado
 * @throws {Error} Error de transacción en PostgreSQL
 */
async function persistCountryProfile(validatedProfile, previousProfile, triggeredBy, tokensUsed, processingMs) {
  const now = new Date();

  return sequelize.transaction(async (t) => {
    // Actualizar el perfil maestro
    await CountryRiskProfiles.update(
      {
        trsOverall:        validatedProfile.trsOverall,
        trsAduanero:       validatedProfile.trsAduanero,
        trsLogistico:      validatedProfile.trsLogistico,
        trsNormativo:      validatedProfile.trsNormativo,
        trsGeopolitico:    validatedProfile.trsGeopolitico,
        riskLevel:         validatedProfile.riskLevel,
        trend:             validatedProfile.trend,
        criticalInsight:   validatedProfile.criticalInsight,
        localSourceAlert:  validatedProfile.localSourceAlert,
        proRecommendation: validatedProfile.proRecommendation,
        sources:           validatedProfile.sources,
        lastUpdatedAt:     now,
        updateStatus:      'completed',
      },
      {
        where: { isoAlpha3: validatedProfile.isoAlpha3 },
        transaction: t,
      }
    );

    // Registrar la actualización en el log de historial
    await RiskUpdateLogs.create(
      {
        isoAlpha3:       validatedProfile.isoAlpha3,
        trsSnapshot:     {
          trsOverall:     validatedProfile.trsOverall,
          trsAduanero:    validatedProfile.trsAduanero,
          trsLogistico:   validatedProfile.trsLogistico,
          trsNormativo:   validatedProfile.trsNormativo,
          trsGeopolitico: validatedProfile.trsGeopolitico,
          riskLevel:      validatedProfile.riskLevel,
          trend:          validatedProfile.trend,
        },
        previousTrs:     parseFloat(previousProfile.trsOverall),
        changesDetected: validatedProfile.changesDetected,
        changesSummary:  validatedProfile.changesSummary,
        triggeredBy,
        aiModel:         process.env.RISK_MAP_AI_MODEL || 'gpt-4o',
        tokensUsed,
        processingMs,
        errorDetails:    null,
      },
      { transaction: t }
    );

    return validatedProfile;
  });
}

// ─── ORQUESTADOR PRINCIPAL ────────────────────────────────────────────────────

/**
 * @description Función principal que orquesta el análisis completo de un país.
 * Pipeline: buildPrompt → callGPT4o → validate → persist.
 * Si GPT falla, marca updateStatus='error' en CountryRiskProfiles y lo registra en
 * RiskUpdateLogs sin sobreescribir el perfil anterior.
 * @param {string} isoAlpha3 - Código ISO alpha-3 del país a analizar
 * @param {'cron'|'manual'|'test'} [triggeredBy='cron']
 * @returns {Promise<{ success: boolean, isoAlpha3: string, trsOverall?: number, changesDetected?: boolean, error?: string }>}
 * @throws {Error} Solo si el país no existe en DB
 */
async function analyzeCountryRisk(isoAlpha3, triggeredBy = 'cron') {
  const profile = await CountryRiskProfiles.findOne({ where: { isoAlpha3 } });
  if (!profile) {
    throw new Error(`País no encontrado en DB: ${isoAlpha3}`);
  }

  // Marcar como 'updating' antes de llamar a GPT — visible en el endpoint /countries
  await CountryRiskProfiles.update(
    { updateStatus: 'updating' },
    { where: { isoAlpha3 } }
  );

  let tokensUsed = 0;
  let processingMs = 0;

  try {
    const promptObj = buildCountryAnalysisPrompt(profile);
    const { text, tokensUsed: tokens, processingMs: ms } = await callGPT4oWithWebSearch(promptObj);
    tokensUsed = tokens;
    processingMs = ms;

    const validated = validateAndSanitizeTRS(text, profile);
    await persistCountryProfile(validated, profile, triggeredBy, tokensUsed, processingMs);

    console.log(
      `[riskMapAI] ✓ ${isoAlpha3} — TRS: ${validated.trsOverall} (${validated.riskLevel}) | ${processingMs}ms | ${tokensUsed} tokens`
    );

    return {
      success: true,
      isoAlpha3,
      trsOverall: validated.trsOverall,
      changesDetected: validated.changesDetected,
    };
  } catch (err) {
    // Mantener el perfil anterior intacto — solo marcar error y registrar en logs
    await CountryRiskProfiles.update(
      { updateStatus: 'error' },
      { where: { isoAlpha3 } }
    );

    await RiskUpdateLogs.create({
      isoAlpha3,
      trsSnapshot:     { trsOverall: parseFloat(profile.trsOverall), riskLevel: profile.riskLevel },
      previousTrs:     parseFloat(profile.trsOverall),
      changesDetected: false,
      changesSummary:  null,
      triggeredBy,
      aiModel:         process.env.RISK_MAP_AI_MODEL || 'gpt-4o',
      tokensUsed,
      processingMs,
      errorDetails:    err.message,
    });

    console.error(`[riskMapAI] ✗ ${isoAlpha3} — Error: ${err.message}`);

    return { success: false, isoAlpha3, error: err.message };
  }
}

module.exports = {
  buildCountryAnalysisPrompt,
  callGPT4oWithWebSearch,
  validateAndSanitizeTRS,
  persistCountryProfile,
  analyzeCountryRisk,
};
