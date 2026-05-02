# Plan de Migración Vanilla JS → Vue 3

**Fecha:** 2026-05-01  
**Estado:** En progreso — Fases 0–3 completas (2026-05-01)

---

## Resumen ejecutivo

El proyecto tiene ~7.000 líneas de JavaScript distribuidas en 5 páginas HTML + 6 archivos de assets. La migración más segura es **incremental por página**, empezando por las páginas públicas simples y terminando con el panel admin (la más compleja). Cada fase produce un deploy independiente y no rompe las páginas no migradas.

La herramienta de build es **Vite**. Firebase SDK se mueve de CDN a **npm** (@firebase/app modular v10). Los CDNs de Chart.js, QRCode.js y PPTXGenJS se reemplazan por sus equivalentes npm. Mammoth.js sigue lazy por razones de tamaño.

---

## Decisiones arquitectónicas

### 1. Vite como build tool

**Decisión: Vite con salida multi-página (MPA).**

Vite soporta nativamente proyectos multi-página mediante entradas múltiples en `vite.config.js`. Cada página HTML genera un bundle independiente, lo que preserva la separación actual de 5 páginas sin refactorizar URLs.

Alternativas descartadas:
- **Vue 3 CDN sin build:** no permite tree-shaking (bundle de Vue CDN ~160 KB), no resuelve D9 (imports compartidos), no permite tests de componentes con Vitest.
- **Webpack:** Vite es el estándar de facto del ecosistema Vue 3 y tiene HMR más rápido para desarrollo.

### 2. Migración incremental por página, no big-bang

Permite deploy tras cada fase, rollback granular, y validar el setup de Vite con páginas simples antes de tocar admin.

### 3. Firebase SDK: de CDN compat a npm modular

El SDK compat (gstatic.com) representa ~200 KB sin tree-shaking. El SDK modular es tree-shakeable. Estrategia: páginas nuevas (Vue) usan SDK modular desde el inicio; `admin-state.js` mantiene SDK compat hasta Fase 4. No hay coexistencia de ambos SDKs en la misma página en ningún momento.

### 4. Estado: `reactive()` de Vue, sin Pinia

El estado actual (`state` + `setState(patch)`) ya sigue el patrón correcto — mapearlo a `reactive()` es casi mecánico. Pinia añade boilerplate innecesario para un store tan plano. Si en el futuro se necesita DevTools o persistencia, migrar de `reactive()` a Pinia es trivial.

### 5. Componentes: un SFC por función de render existente

Cada `renderXxx()` se convierte en `XxxView.vue` o `XxxPanel.vue`. Las ~40 funciones de `admin-render.js` mapean a ~12 componentes de vista + ~25 componentes de UI reutilizable.

### 6. CSS: sin cambios en Fases 1-4

`admin.css` se importa en el entry point de Vite sin modificaciones. Los tokens CSS custom se pueden migrar en una fase posterior.

### 7. CSP y `unsafe-inline`

La migración a Vue 3 elimina todos los `onclick="..."` inline. Al finalizar la Fase 5 se puede endurecer la CSP eliminando `'unsafe-inline'` de `script-src` y `style-src`, cerrando D7 completamente.

---

## Prerequisito antes de empezar

Verificar que `npm test` y `npm run lint` pasan en verde. Crear un tag git `pre-vue-migration` para rollback claro.

```bash
git tag pre-vue-migration
git push origin pre-vue-migration
```

---

## Fase 0 — Setup de Vite ✅ `20d2e28`

**Objetivo:** Introducir Vite sin tocar ninguna página. Al final, el build produce archivos equivalentes a los actuales y Firebase Hosting sirve desde `dist/`.

**Esfuerzo:** 1 día | **Riesgo:** Bajo

### Pasos

**0.1 — Instalar dependencias**

```bash
npm install --save-dev vite @vitejs/plugin-vue
npm install vue@3 firebase@10
```

**0.2 — Crear `vite.config.js`**

```js
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  build: {
    rollupOptions: {
      input: {
        admin:      resolve(__dirname, 'admin.html'),
        assessment: resolve(__dirname, 'assessment-agile.html'),
        equipo:     resolve(__dirname, 'equipo.html'),
        reporte:    resolve(__dirname, 'reporte.html'),
        facilitar:  resolve(__dirname, 'facilitar.html'),
      },
    },
    outDir: 'dist',
  },
  resolve: {
    alias: {
      '@':       resolve(__dirname, 'src'),
      '@shared': resolve(__dirname, 'shared'),
    },
  },
});
```

**0.3 — Adaptar `firebase.json`**

```json
{ "hosting": { "public": "dist" } }
```

**0.4 — Agregar step de build en CI (`.github/workflows/deploy.yml`)**

```yaml
- name: Build
  run: npm run build
```

**0.5 — Agregar script `build` en `package.json`**

```json
{ "scripts": { "build": "vite build" } }
```

**0.6 — Crear estructura de directorios**

```
src/
  pages/           ← entry points Vue
  components/      ← SFCs
  composables/     ← composables reutilizables
  firebase.js      ← inicialización Firebase modular
shared/
  config.js        ← re-export de assessment-config.js (resuelve D9 en Fase 6)
```

**Rollback:** revertir `firebase.json` a `"public": "."` y eliminar `vite.config.js`.

---

## Fase 1 — equipo.html + reporte.html ✅ `b356ff1`

**Objetivo:** Primeros SFCs en producción. Son las páginas más simples: solo lectura, sin auth, sin Chart.js.

**Esfuerzo:** 2-3 días | **Riesgo:** Bajo

**Lo que cambió respecto al plan original:**
- `vite.config.js` → renombrado a `vite.config.mjs` (ESM explícito — `@vitejs/plugin-vue@6.x` y `vite-plugin-static-copy` son ESM-only)
- Chart.js importado con tree-shaking manual (RadarController, RadialLinearScale, etc.) — no `chart.js/auto`
- `useRadarChart.js` composable compartido por EquipoApp y ReporteApp

### Pasos

**1.1 — Crear `src/firebase.js`** (inicialización modular centralizada)

```js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = { /* mismas credenciales actuales */ };
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const fns = getFunctions(app);
```

**1.2 — Crear entry points** `src/pages/equipo.js` y `src/pages/reporte.js`

```js
import { createApp } from 'vue';
import EquipoApp from '../components/EquipoApp.vue';
createApp(EquipoApp).mount('#app');
```

**1.3 — Adaptar HTMLs:** reemplazar `<script>` inline + tags CDN de Firebase con un import al entry point de Vite.

**1.4 — Crear `EquipoApp.vue` y `ReporteApp.vue`** replicando la lógica existente con Composition API y SDK modular.

**Riesgo específico:** API modular vs compat (`getDoc(doc(db, ...))` vs `db.collection(...).get()`). Las diferencias son mecánicas pero hay que revisarlas todas.

---

## Fase 2 — assessment-agile.html ✅ `99b227e`

**Objetivo:** El formulario público principal como SFC Vue. ~1.193 líneas inline → componentes.

**Esfuerzo:** 3-4 días | **Riesgo:** Medio (página más usada por usuarios finales)

**Lo que cambió respecto al plan original:**
- Un solo SFC `AssessmentApp.vue` (no se dividió en sub-componentes) — todos los screens en `v-if` directamente. Apropiado dado el acoplamiento de estado entre screens.
- `build.commonjsOptions: { include: [/assessment-config\.js$/] }` en `vite.config.mjs` para que Rollup consuma el `module.exports` condicional de `assessment-config.js` sin tocar el archivo fuente (admin.html lo sigue cargando como `<script>` plano).
- 1241 líneas → 12 líneas en `assessment-agile.html`.

---

## Fase 3 — facilitar.html ✅ `9091677`

**Objetivo:** Herramienta de facilitación (~1.193 líneas) como SFC Vue. Sirve de ensayo para el patrón auth + estado que se reutiliza en admin (Fase 4).

**Esfuerzo:** 3-4 días | **Riesgo:** Bajo (uso interno)

**Lo que cambió respecto al plan original:**
- Un solo SFC `FacilitarApp.vue` en lugar de tres componentes separados — el estado de slides está demasiado acoplado al login y la sesión para dividirlo con ganancia real.
- No se creó `useFirebaseAuth.js` — `onAuthStateChanged` se llama directamente en `onMounted` del componente. Para admin (Fase 4) se evaluará si el composable aporta suficiente para justificarlo.
- Keyboard navigation con `addEventListener`/`removeEventListener` en `onMounted`/`onUnmounted`.
- Export a ventana de print conservado como función JS pura (genera HTML con `window.open` + `document.write`) — no necesita Vue.
- 1193 líneas → 12 líneas en `facilitar.html`.

---

## Fase 4 — Admin: infraestructura Vue

**Objetivo:** Convertir `admin.html` en app Vue funcional con el mismo comportamiento actual. Las tabs aún renderizan HTML existente via `v-html` (compatibilidad temporal). Los `onclick` inline siguen funcionando porque las funciones permanecen globales.

**Esfuerzo:** 4-5 días | **Riesgo:** Alto

### Estrategia `v-html` temporal

Durante esta fase, las tabs aún se llaman como funciones JS y se inyectan en un `<div v-html>`. Es intencionalmente temporal: permite deployar la infraestructura Vue sin reescribir las 2.900 líneas de render. Se elimina en Fase 5.

### Pasos

**4.1 — Migrar `admin-state.js` a `reactive()`**

```js
import { reactive } from 'vue';
export const state = reactive({ /* todos los campos actuales */ });
export function setState(patch) { Object.assign(state, patch); }
// render() pasa a ser no-op
```

**4.2 — Migrar Firebase a SDK modular en admin** usando `src/firebase.js`.

**4.3 — Crear `AdminApp.vue`**

```vue
<template>
  <AdminLogin v-if="!state.currentUser" />
  <AdminShell v-else />
  <ToastNotification />
  <!-- modales (por ahora como divs estáticos, se Vue-ifican en Fase 5) -->
</template>
```

**4.4 — Crear `AdminShell.vue`** con tab bar reactivo. El contenido de cada tab se inyecta via `v-html` + computed que llama a las funciones de render existentes.

**4.5 — Chart.js y timing:** mover `initRadarCharts()` a `nextTick()` de Vue para garantizar que el canvas esté en el DOM.

**Rollback:** revertir `admin.html` al archivo pre-migración (guardado en tag `pre-vue-migration`).

---

## Fase 5 — Admin: componentes individuales

**Objetivo:** Reemplazar cada `renderXxx()` con SFC Vue. Eliminar `v-html`. Eliminar funciones globales de render.

**Esfuerzo:** 8-12 días | **Riesgo:** Medio por grupos

Se hace en grupos deployables, de menor a mayor complejidad:

### Grupo A — Componentes atómicos (1-2 días)
`ToastNotification.vue`, `TabBar.vue`, `StatCard.vue`, `RolePill.vue`, `LoginForm.vue`

### Grupo B — Tabs sin charts (2-3 días)
`TeamsView.vue`, `PlanView.vue`, `UsuariosView.vue`

### Grupo C — Tabs con charts (2-3 días)
`EvolutionView.vue`, `AnalysisView.vue` (dividida en: `TeamCard.vue`, `RadarChart.vue`, `ParticipationPanel.vue`, `AIPanel.vue`, `CommentsPanel.vue`)

Usar `@vue/chart.js` o wrapper manual con `onMounted`/`onUpdated`. Reemplaza el patrón `window._radarData` con `watchEffect`.

### Grupo D — Modales (2-3 días)
`QRModal.vue`, `CloseCycleModal.vue`, `DebriefGuide.vue`

Preservar la lógica de foco implementada en D5.

### Grupo E — Config (1-2 días)
`ConfigView.vue`

**Al terminar cada grupo:** eliminar las funciones JS correspondientes de `admin-render.js`. Al terminar Grupo E, `admin-render.js` queda vacío y se elimina del proyecto.

---

## Fase 6 — Limpieza y endurecimiento

**Esfuerzo:** 2-3 días | **Riesgo:** Bajo

### 6.1 — Resolver D9: shared config

Mover `assessment-config.js` a `shared/config.js` e importarlo tanto desde los componentes Vue como desde `functions/index.js`. Elimina la duplicación de `DIMS_CFG`/`SECTIONS_CFG` en functions.

### 6.2 — Endurecer CSP (cierra D7 completamente)

Con todos los `onclick` inline eliminados, quitar `'unsafe-inline'` de `script-src` y `style-src` en `firebase.json`.

### 6.3 — Tests de componentes (cierra D6)

Con Vitest + `@vue/test-utils`, agregar tests de render para los componentes críticos (`AnalysisView`, `AssessmentSection`, `LoginForm`).

### 6.4 — Mammoth.js como dynamic import

```js
const { default: mammoth } = await import('mammoth');
```

Reemplaza el workaround de `document.createElement('script')`.

---

## Tabla resumen

| Fase | Contenido | Estado | Commit |
|------|-----------|--------|--------|
| 0 | Setup Vite, dist/, CI | ✅ Completo | `20d2e28` |
| 1 | equipo.html + reporte.html | ✅ Completo | `b356ff1` |
| 2 | assessment-agile.html | ✅ Completo | `99b227e` |
| 3 | facilitar.html | ✅ Completo | `9091677` |
| 4 | Admin: shell Vue + estado reactivo | ⏳ Pendiente | — |
| 5A | Admin: componentes atómicos + tabs simples | ⏳ Pendiente | — |
| 5B | Admin: tabs con charts | ⏳ Pendiente | — |
| 5C | Admin: modales + Config | ⏳ Pendiente | — |
| 6 | Limpieza, CSP, tests | ⏳ Pendiente | — |

Cada fase es deployable de forma independiente. La app permanece funcional en producción durante toda la migración.

---

## Riesgos transversales

| # | Riesgo | Fase | Mitigación |
|---|--------|------|------------|
| R1 | Chart.js canvas no disponible con `v-html` | 4 | `nextTick()` antes de `initRadarCharts()` |
| R2 | Funciones globales en `onclick` inline durante transición | 4-5 | No eliminar funciones del scope global hasta que el SFC correspondiente esté en producción |
| R3 | Timing Firebase Auth vs hidratación Vue | 4+ | `useFirebaseAuth` expone `loading: true` inicial |
| R4 | Tests CI durante la transición | 5 | Verificar `tests/setup.js` al eliminar funciones de `admin-api.js` |
| R5 | CDN domains en CSP | 6 | No quitar `cdnjs`/`jsdelivr` de CSP hasta confirmar que ninguna página los usa |

---

## Lo que NO cambia en ninguna fase

- `assessment-config.js` — sin tocar hasta Fase 6
- Firebase project, Firestore rules, Cloud Functions
- URL structure y rewrites de `firebase.json`
- Los 96 tests existentes — deben pasar en verde durante todo el proceso
- Diseño visual y UX
