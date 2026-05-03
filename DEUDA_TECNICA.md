# Deuda Técnica — Backlog de hallazgos

Backlog vivo de hallazgos de auditorías tácticas. Complementa a `PLAN_ARQUITECTURA.md` (plan estratégico: Vue 3, paginación, auditoría). Acá van los ítems chicos que surgen de revisiones de código, pair-reviews, bugs de producción y auditorías de buenas prácticas.

**Última auditoría:** 2026-04-23 (buenas prácticas previas a refactor Vue 3).  
**Última actualización:** 2026-05-03 — Migración Vue 3 completa (Fase 6.3). 109 tests.

---

## Prioridad Media

### D3 — Monitoring en producción (Sentry / Crashlytics)

**Contexto:** Errores en producción pasan silenciosos. No hay forma de detectar un spike de fallos de CF sin mirar manualmente Firebase Console. Un bug que afecte a un cliente pasa desapercibido hasta que él lo reporta.

**Propuesta:** integrar Sentry (free tier hasta 5k errors/mes) o Firebase Crashlytics web. Capturar:

- Uncaught exceptions en frontend (admin.html, assessment-agile.html, equipo.html, reporte.html)
- CF errors con contexto (uid, equipoId, ciclo)

**Esfuerzo:** M (medio día).

---


---

## Prioridad Baja


---

## Resuelto

| Fecha      | Ítem                                                                                                                                                                                                                                                                                                           | Commit    |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| 2026-04-23 | Endurecer ESLint (no-var, prefer-const, eqeqeq); cubrir `tests/`                                                                                                                                                                                                                                               | `04caac9` |
| 2026-04-23 | Agregar Prettier + scripts `format`/`format:check`                                                                                                                                                                                                                                                             | `04caac9` |
| 2026-04-23 | Pre-commit hook (`simple-git-hooks` + `lint-staged`) con lint + prettier-check                                                                                                                                                                                                                                 | `04caac9` |
| 2026-04-23 | Escape HTML en 7 interpolaciones user-controlled de `admin-render.js`                                                                                                                                                                                                                                          | `abfee42` |
| 2026-04-23 | **D1** — Helper `e()` unificado en `assets/escape.js` (5 entidades) cargado por las 5 páginas; eliminados escapes ad-hoc incompletos                                                                                                                                                                           | `b2e770f` |
| 2026-04-24 | **D2** — `functions.logger` estructurado en todas las CFs; colección `auditLog` (read: super_admin, write: false) con helper `writeAudit`; integrado en `createWorkspaceAdmin`, `deleteWorkspaceAdmin`, `analyzeTeamWithClaude`; eliminados los 2 `catch { /* silent */ }` y 3 `.catch(() => {})` del frontend | `fa01fae` |
| 2026-04-24 | **D8** — `.gitattributes` con `* text=auto eol=lf` + binarios comunes; `.prettierrc.json` revertido a `endOfLine: lf`; renormalización de 26 archivos (formato puro, sin lógica)                                                                                                                                | `bcbc853` |
| 2026-05-01 | **D4** — `README.md` con setup local, tests, lint, secrets (Secret Manager), deploy y datos de prueba | `f6c6f85` |
| 2026-05-01 | **D5** — Listener global `Escape` cierra modales; `aria-label="Cerrar"` en botones ✕; foco al primer botón al abrir; foco devuelto al disparador al cerrar. Migrado a `onMounted`/`onUnmounted` en QRModal y CloseCycleModal (Fase 5D). | `b0a7ce7` |
| 2026-05-01 | **D7** — CSP en `firebase.json`: allowlist gstatic/jsdelivr/cdnjs/fonts; connect-src Firebase; `object-src 'none'`; `frame-ancestors 'none'`; `X-Content-Type-Options: nosniff`. | `3771ef8` |
| 2026-05-02 | **D7.2** — `'unsafe-inline'` eliminado de `script-src` (Fase 6.2). `style-src` conserva `'unsafe-inline'` — necesario por inline `style=` en templates Vue (no es vector de ejecución de código). | — |
| 2026-05-02 | **D10** — Funciones gigantes en `admin-render.js`: todas las `renderXxx()` convertidas a SFCs Vue (Fases 4-5). `admin-render.js` queda solo con funciones de negocio puras (sin DOM). Bundle admin: −92 kB. | `1baea8b`…`2180a3a` |
| 2026-05-02 | **D9** — `DIMS_CFG`/`SECTIONS_CFG` duplicados en `functions/index.js` eliminados. CF ahora usa `require('./assessment-config')` (copiado via predeploy hook en `firebase.json`). Bug colateral: `transparencia.max` corregido de 9 → 12 en functions. | — |
| 2026-05-03 | **D6** — `@vue/test-utils` + `happy-dom`; `vitest.config.mjs`; suite de componentes: `AssessmentApp.test.js` (8 tests — screens, rol, navegación) + `EquipoApp.test.js` (5 tests — estados, plan status). Total: 96 → **109 tests**. | — |

---

## Cómo usar este documento

- **Al auditar:** agregar hallazgos nuevos con código `D#` secuencial y prioridad.
- **Al cerrar un ítem:** mover a la tabla "Resuelto" con fecha + commit.
- **Al tocar un archivo:** revisar si hay un ítem D# relacionado y considerar arreglarlo de paso.
- **Superposición con `PLAN_ARQUITECTURA.md`:** marcar explícitamente cuando un ítem D# sea un sub-tema táctico de un ítem estratégico (ej. D2 ⊂ Ítem 9).
