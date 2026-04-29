# USUARIOS DE PRUEBA — TARIC AI
## ⚠️ MÓDULO TEMPORAL — ELIMINAR COMPLETAMENTE ANTES DE PRODUCCIÓN

---

## COMANDOS DE USO RÁPIDO

```bash
# Desde la carpeta backend/
node usuariosPrueba/seeders/index.js           # Cargar datos de prueba
node usuariosPrueba/seeders/index.js --clean   # Eliminar datos de prueba
```

---

## RESUMEN DE EMPRESAS

| # | Empresa | Plan | Stripe Status | Usuarios | Equipos | Clasificaciones | Chats |
|---|---------|------|--------------|----------|---------|-----------------|-------|
| 1 | Logística Andina S.A.S | Free | active (sin Stripe) | 1 | 0 | 5 | 0 |
| 2 | GlobalTrade Solutions | Pro | active | 1 | 0 | 12 | 2 |
| 3 | ComerExport Group | Team | active | 8 | 3 | 45 | 2 |
| 4 | Adriatica Imports EU | Team | **past_due** | 4 | 1 | 10 | 1 |
| 5 | Nexus Enterprise Corp | Enterprise | active | 6 | 2 | 80 | 2 |
| | **TOTALES** | | | **20** | **6** | **152** | **7** |

---

## ÍNDICE DE USUARIOS

| Email | Contraseña | Empresa | Rol | Plan |
|-------|-----------|---------|-----|------|
| carlos.mendez@logisticaandina.co | Andina2024! | Logística Andina | Owner | Free — 5/5 clasificaciones usadas |
| sofia.ramirez@globaltradesolutions.com | GlobalTrade2024! | GlobalTrade Solutions | Owner | Pro |
| ana.torres@comerexportgroup.com | ComerOwner2024! | ComerExport Group | Owner | Team |
| luis.garcia@comerexportgroup.com | ComerAdmin1_2024! | ComerExport Group | Admin | Team |
| paula.rios@comerexportgroup.com | ComerAdmin2_2024! | ComerExport Group | Admin | Team |
| jorge.vega@comerexportgroup.com | ComerMember1_2024! | ComerExport Group | Member | Team |
| diana.mora@comerexportgroup.com | ComerMember2_2024! | ComerExport Group | Member | Team |
| pablo.leon@comerexportgroup.com | ComerMember3_2024! | ComerExport Group | Member | Team |
| lucia.campos@comerexportgroup.com | ComerMember4_2024! | ComerExport Group | Member | Team |
| tomas.ibarra@comerexportgroup.com | ComerMember5_2024! | ComerExport Group | Member | Team |
| marco.rossi@adriatica-eu.com | AdriaticaOwner2024! | Adriatica Imports EU | Owner | Team ⚠️ past_due |
| elena.bauer@adriatica-eu.com | AdriaticaAdmin2024! | Adriatica Imports EU | Admin | Team ⚠️ past_due |
| jan.kovac@adriatica-eu.com | AdriaticaMember1_2024! | Adriatica Imports EU | Member | Team ⚠️ past_due |
| anna.patel@adriatica-eu.com | AdriaticaMember2_2024! | Adriatica Imports EU | Member | Team ⚠️ past_due |
| victoria.chen@nexusenterprise.com | NexusOwner2024! | Nexus Enterprise Corp | Owner | Enterprise |
| rafael.ortiz@nexusenterprise.com | NexusAdmin1_2024! | Nexus Enterprise Corp | Admin | Enterprise |
| yuki.tanaka@nexusenterprise.com | NexusAdmin2_2024! | Nexus Enterprise Corp | Admin | Enterprise |
| priya.sharma@nexusenterprise.com | NexusMember1_2024! | Nexus Enterprise Corp | Member | Enterprise |
| david.okonkwo@nexusenterprise.com | NexusMember2_2024! | Nexus Enterprise Corp | Member | Enterprise |
| isabelle.dupont@nexusenterprise.com | NexusMember3_2024! | Nexus Enterprise Corp | Member | Enterprise |

---

## NOTAS PARA EL EQUIPO DE DESARROLLO

1. **Andina (Free)** tiene exactamente 5/5 clasificaciones — la 6ª debe devolver HTTP 429.
2. **Adriatica (past_due)** tiene nuevas clasificaciones bloqueadas por `planLimiter`. Sus 10 clasificaciones existentes fueron creadas cuando el plan estaba activo.
3. **IDs de Stripe** (`cus_seed_*`, `sub_seed_*`) son ficticios — no hacer llamadas a la API de Stripe.
4. **URLs de Cloudinary** (`/seed/*`) son ficticias — GPT-4o Vision no las procesará.
5. Contraseñas de este archivo son solo de prueba — nunca usar en producción.
