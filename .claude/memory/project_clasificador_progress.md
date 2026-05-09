---
name: Módulos TaricAI — Progreso
description: Estado de implementación de los módulos principales de TaricAI
type: project
---

Clasificador ✅ · Chat IA ✅ · Seed prueba ✅ (Apr 29) · Fix Dashboard+Team nav bug ✅

## Clasificador Arancelario — v2.2 (May 9, 2026)

Actualización mayor ejecutada desde `promptactualizacionclasificador.md` v2.2. Corrige 7 errores críticos (E1-E7).

### Archivos NUEVOS creados:
- `backend/src/services/source.fallback.js` — Nivel 2/3 fallback cuando fuentes oficiales fallan
- `backend/src/services/agreement.validator.js` — Corrector de acuerdos falsos positivos (IA inventa TLCs)
- `backend/src/services/response.validator.js` — Validador post-IA de completitud y consistencia
- `backend/src/utils/known.agreements.js` — Base de datos de acuerdos verificados y falsos positivos
- `frontend/src/utils/classification.compat.js` — Retrocompatibilidad legacy/v2.2 para resultJson
- `frontend/src/components/classifier/TaxComparisonTable.jsx` — Tabla espejo tributos exportador/importador
- `frontend/src/components/classifier/NTBComparison.jsx` — Comparación barreras no arancelarias
- `frontend/src/components/classifier/RiskProgressBar.jsx` — Barra animada de riesgo aduanero

### Archivos MODIFICADOS:
- `backend/src/utils/official.sources.js` — Mapa completo 50+ países, fix BIS URL, getCountrySources()
- `backend/src/services/tariff.service.js` — Estrategia 3 niveles + retry + fallback + allSourcesFailed
- `backend/src/services/openai.service.js` — Nuevos system prompts (7.2-7.6), task types: classify_basic, reinforce
- `backend/src/services/mirror.service.js` — Produce { resultJson v2.2, mirrorAnalysis v2.2 } en una llamada
- `backend/src/services/classifier.service.js` — Nuevo flujo: buildClassification + applyPostValidation + validadores
- `frontend/src/components/classifier/ResultsPanel.jsx` — Soporte v2.2 + legacy via compat
- `frontend/src/components/classifier/CostBreakdown.jsx` — Tasas reales, sin placeholders ···
- `frontend/src/components/classifier/DocumentsChecklist.jsx` — Layout espejo 2 columnas exportador/importador
- `frontend/src/components/classifier/MirrorAnalysis.jsx` — 8 secciones v2.2 + fallback legacy
- `frontend/src/components/classifier/TariffCard.jsx` — Soporte v2.2 y legacy

### Nueva estructura v2.2:
- `resultJson.meta.version = '2.2'` → trigger para renderizado nuevo
- `resultJson.exporter` → datos exportador (subpartida, exportDuties, exportDocuments, exportRequirements)
- `resultJson.importer` → datos importador (subpartida, importDuties, importDocuments, importRequirements)
- `resultJson.tradeAgreements` → validado y corregido por agreement.validator
- `resultJson.costBreakdown.items[]` → tasas reales con concept, rate, calculation, source
- `mirrorAnalysis.taxComparison` → tabla espejo tributos
- `mirrorAnalysis.documentComparison` → comparación documentos + criticalMissing
- `mirrorAnalysis.ntbComparison` → barreras no arancelarias por país
- `mirrorAnalysis.riskAssessment.overallLevel` + probability + riskFactors[]

### Variables de entorno agregadas al backend/.env:
SOURCE_RETRY_COUNT=1, SOURCE_FALLBACK_ENABLED=true, AI_VALIDATION_ENABLED=true, AI_RETRY_ON_INCOMPLETE=true

**Why:** Corrige errores de producción donde el clasificador mostraba "···" en tributos, documentos vacíos, acuerdos inventados (TLC UE-China), y fuentes consultadas sin datos extraídos.
**How to apply:** Clasificaciones antiguas en DB mantienen formato legacy → detectVersion() → renderizado antiguo. Nuevas clasificaciones usan v2.2.
