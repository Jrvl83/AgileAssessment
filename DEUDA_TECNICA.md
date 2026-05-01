# Deuda Técnica — Backlog de hallazgos

Backlog vivo de hallazgos de auditorías tácticas. Complementa a `PLAN_ARQUITECTURA.md` (plan estratégico: Vue 3, paginación, auditoría). Acá van los ítems chicos que surgen de revisiones de código, pair-reviews, bugs de producción y auditorías de buenas prácticas.

**Última auditoría:** 2026-04-23 (buenas prácticas previas a refactor Vue 3).

---

## Prioridad Media

### D3 — Monitoring en producción (Sentry / Crashlytics)

**Contexto:** Errores en producción pasan silenciosos. No hay forma de detectar un spike de fallos de CF sin mirar manualmente Firebase Console. Un bug que afecte a un cliente pasa desapercibido hasta que él lo reporta.

**Propuesta:** integrar Sentry (free tier hasta 5k errors/mes) o Firebase Crashlytics web. Capturar:

- Uncaught exceptions en frontend (admin.html, assessment-agile.html, equipo.html, reporte.html)
- CF errors con contexto (uid, equipoId, ciclo)

**Esfuerzo:** M (medio día).

---

### D4 — README de onboarding

**Contexto:** No hay `README.md` en el repo. `PROYECTO.md` es documentación funcional detallada, no onboarding. Falta:

- Pasos de setup local (`npm install` en raíz y en `functions/`)
- Instrucciones de emuladores Firebase
- Variables de entorno / secrets (dónde se configura `ANTHROPIC_API_KEY`, `webhookUrl`)
- Cómo correr la app sin desplegar
- Cómo correr tests

**Propuesta:** `README.md` breve (<150 líneas) enfocado en "empezar a contribuir en 10 minutos". Link a `PROYECTO.md` para detalles funcionales.

**Esfuerzo:** S (2–3 horas).

---

### D6 — Tests de render/auth/CFs ausentes

**Contexto:** 96 tests Vitest, pero 100% son unitarios sobre `admin-api.js` y `assessment-config.js`. No hay tests para:

- `render()` y funciones `render*` de `admin-render.js` (genera HTML dinámico)
- Flujos de autenticación (`admin-auth.js`)
- Cloud Functions (requiere emulator)
- Flujos de integración (submit assessment → Firestore → cálculo)

**Propuesta:** agregar suite progresiva:

- `tests/render.test.js` con JSDOM para las funciones `render*` puras (reciben state, retornan string).
- `tests/functions.test.js` con Firebase emulator para CFs.
- No apuntar al 100% — priorizar rutas críticas (callAnalyzeTeamWithClaude, createUser).

**Esfuerzo:** L (3–5 días). Superpone con `PLAN_ARQUITECTURA.md` ítem 6 (que se marcó como completo con 59 tests — está incompleto en alcance).

---

## Prioridad Baja

### D7 — CSP headers ausentes

**Contexto:** `firebase.json` no configura `Content-Security-Policy`. Los navegadores aceptan cualquier fuente de scripts. Aunque usamos CDNs conocidos (jsDelivr, cdnjs, gstatic), un XSS exitoso tendría ejecución total.

**Propuesta:** agregar header CSP en `firebase.json` con allowlist de los CDNs actuales:

```json
"headers": [{ "source": "**",
  "headers": [{ "key": "Content-Security-Policy",
    "value": "default-src 'self'; script-src 'self' https://*.gstatic.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; ..." }]}]
```

Testear en staging antes de producción — CSP estricta puede romper inline styles o event handlers.

**Esfuerzo:** S (medio día), pero requiere validación cuidadosa.

---

### D9 — Duplicación de lógica entre `admin-api.js` y `functions/index.js`

**Contexto:** `DIMS`, `SECTIONS`, las recomendaciones y parte del scoring están duplicados entre `assessment-config.js` (frontend) y `functions/index.js` como `DIMS_CFG`, `SECTIONS_CFG`. Cualquier cambio obliga a tocar ambos.

**Propuesta:** mover a `shared/config.js` importado por ambos. Requiere resolver el bundling de CFs (no acepta require de fuera de su carpeta sin workaround).

**Esfuerzo:** M (medio día, bloqueado hasta migración a ES modules).

---

### D10 — Funciones gigantes en `admin-render.js`

**Contexto:** `generateDebriefGuide()` tiene ~800 líneas. `render()` llama a ~15 funciones que concatenan template literals con 6+ niveles de anidamiento.

**Propuesta:** se resolverá cuando migremos a Vue 3 (ítem 4 de `PLAN_ARQUITECTURA.md`). Por ahora, al tocar cada función, extraer sub-funciones si se puede sin riesgo.

**Esfuerzo:** L (depende de la migración).

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
| 2026-05-01 | **D5** — Listener global `Escape` cierra `qr-modal` y `close-cycle-modal`; `aria-label="Cerrar"` en botones ✕ (3 modales); foco al primer botón al abrir; foco devuelto al disparador al cerrar | pendiente |

---

## Cómo usar este documento

- **Al auditar:** agregar hallazgos nuevos con código `D#` secuencial y prioridad.
- **Al cerrar un ítem:** mover a la tabla "Resuelto" con fecha + commit.
- **Al tocar un archivo:** revisar si hay un ítem D# relacionado y considerar arreglarlo de paso.
- **Superposición con `PLAN_ARQUITECTURA.md`:** marcar explícitamente cuando un ítem D# sea un sub-tema táctico de un ítem estratégico (ej. D2 ⊂ Ítem 9).
