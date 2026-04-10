# Plan de Arquitectura — Bases Sólidas para Escalar

## Contexto

La herramienta funciona correctamente como MVP pero tiene deuda técnica que se convierte en riesgo real al escalar. Este plan organiza las mejoras por prioridad: primero lo que es un riesgo activo, luego lo que bloquea el crecimiento, finalmente lo que mejora la mantenibilidad a largo plazo.

---

## Fases

```
Fase 1 — Seguridad (antes de crecer la base de usuarios)
  Ítem 1 → Ítem 2

Fase 2 — Arquitectura de código (antes de agregar más features)
  Ítem 3 → Ítem 4 → Ítem 5

Fase 3 — Confiabilidad (antes de clientes exigentes)
  Ítem 6 → Ítem 7

Fase 4 — Escala técnica (cuando haya volumen real de datos)
  Ítem 8 → Ítem 9
```

---

## Detalle por ítem

---

### Ítem 1 — Firestore Security Rules con validación server-side `[Alta]`

**Problema:**
Las reglas actuales permiten que cualquier usuario autenticado lea todos los documentos de `equipos`, `ciclos` y `planes`. El filtro por `ownerId` se hace en el cliente (JavaScript), lo que significa que un admin con DevTools puede hacer queries directas y ver datos de otros workspaces.

**Solución:**
Agregar validación de `ownerId` directamente en las rules. Para distinguir super_admin de admin, las rules leen el documento `usuarios/{uid}` del solicitante.

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isSuperAdmin() {
      return get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.role == 'super_admin';
    }

    function isOwner(resource) {
      return resource.data.ownerId == request.auth.uid;
    }

    // Respuestas — escritura pública (formulario sin login), lectura solo autenticados
    match /respuestas/{id} {
      allow create: if true;
      allow read, update, delete: if request.auth != null && (isSuperAdmin() || isOwner(resource));
    }

    match /equipos/{id} {
      allow read: if request.auth != null && (isSuperAdmin() || isOwner(resource));
      allow create: if request.auth != null && request.resource.data.ownerId == request.auth.uid;
      allow update, delete: if request.auth != null && (isSuperAdmin() || isOwner(resource));
    }

    match /ciclos/{id} {
      allow read: if request.auth != null && (isSuperAdmin() || isOwner(resource));
      allow create: if request.auth != null && request.resource.data.ownerId == request.auth.uid;
      allow update, delete: if request.auth != null && (isSuperAdmin() || isOwner(resource));
    }

    match /planes/{id} {
      allow read, write: if request.auth != null && (isSuperAdmin() || isOwner(resource));
    }

    match /usuarios/{uid} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && isSuperAdmin();
    }
  }
}
```

**Impacto:** Elimina el riesgo de que un workspace admin acceda a datos de otro workspace, incluso usando DevTools o llamadas directas a la API de Firestore.

**Consideración:** La función `isSuperAdmin()` hace un `get()` adicional por request. Firestore cobra por lecturas — con pocos usuarios es despreciable, pero hay que tenerlo en cuenta a escala.

---

### Ítem 2 — Cloud Function para creación de usuarios `[Alta]`

**Problema:**
La creación de usuarios usa una segunda instancia de Firebase App en el cliente (`secondaryApp`) para evitar cerrar la sesión del super admin. Esto es un workaround frágil: expone las credenciales de la app secundaria, no escala si se necesita lógica adicional (ej. notificaciones, auditoría) y no permite eliminar cuentas de Firebase Auth desde el cliente.

**Solución:**
Crear una **Cloud Function HTTPS callable** con Firebase Admin SDK que el cliente invoca. El cliente solo llama `functions.httpsCallable('createWorkspaceAdmin')({ nombre, email })`.

```
La Cloud Function:
1. Verifica que el llamador sea super_admin (via Admin SDK)
2. Crea la cuenta en Firebase Auth con Admin SDK
3. Guarda el documento en usuarios/{uid}
4. Envía el correo de invitación (password reset)
5. Retorna { success: true, uid }
```

**También habilita:**
- `deleteUser`: eliminar cuenta real de Firebase Auth, no solo el documento Firestore
- Auditoría: log de quién creó/eliminó qué cuenta y cuándo
- Rate limiting: evitar abuso de creación masiva de cuentas

**Stack:** Node.js 20 + Firebase Admin SDK. Se despliega con `firebase deploy --only functions`.

---

### Ítem 3 — Separar código en archivos modulares `[Media]`

**Problema:**
`admin.html` tiene ~1600 líneas mezclando HTML estructural, estilos CSS y lógica JavaScript. Agregar features o corregir bugs requiere navegar un archivo enorme, aumentando el riesgo de errores y dificultando la colaboración.

**Solución:**
Separar en archivos con responsabilidades claras, manteniendo vanilla JS (sin framework por ahora):

```
/
├── admin.html              ← Solo estructura HTML y scripts tags
├── assets/
│   ├── admin.css           ← Todos los estilos del panel admin
│   ├── admin-state.js      ← Variables de estado globales
│   ├── admin-api.js        ← fetchAllData, addTeam, addCycle, fetchPlans...
│   ├── admin-auth.js       ← login, logout, onAuthStateChanged, createUser...
│   ├── admin-render.js     ← render, renderLogin, renderShell, renderAnalysis...
│   └── admin-export.js     ← exportCSV, exportPDF, exportRaw
├── assessment-agile.html
└── assessment-config.js
```

**Impacto:** Cada archivo tiene una responsabilidad única. Un bug en la lógica de auth no requiere abrir el archivo de render. Facilita que otra persona contribuya al proyecto.

---

### Ítem 4 — Migrar a un framework de componentes `[Media]`

**Problema:**
El HTML se genera concatenando template strings:
```js
return `<div class="team-row">${t.name}<button onclick="deleteTeam('${t.id}')">✕</button></div>`;
```
Esto es frágil ante caracteres especiales, mezcla lógica con presentación y hace imposible el testing de componentes individuales.

**Solución recomendada: Vue 3 (sin build step, via CDN)**
Vue 3 permite usarlo directamente desde CDN sin Webpack ni Vite, lo que mantiene la simplicidad del proyecto actual y no requiere cambiar el flujo de deploy:

```html
<script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
```

Beneficios concretos sobre el approach actual:
- Componentes reactivos — no hay que llamar `render()` manualmente
- Templates HTML reales — sin riesgo de injection por caracteres especiales
- `v-if`, `v-for` en lugar de ternarios en strings
- Props tipadas entre componentes

**Alternativa más conservadora:** Mantener vanilla JS pero extraer cada sección como una función pura que recibe datos y retorna HTML, sin efectos secundarios, lo que permite testearlas.

---

### Ítem 5 — Manejo de estado centralizado `[Media]`

**Problema:**
El estado de la aplicación son ~20 variables globales que cualquier función puede leer y mutar directamente. No hay trazabilidad de qué función cambió qué variable ni cuándo. A medida que crecen las features, los bugs de estado son difíciles de reproducir.

**Solución:**
Centralizar el estado en un objeto único con mutaciones controladas:

```js
const state = {
  currentUser: null,
  currentRole: null,
  teams: [],
  responses: [],
  // ...
};

function setState(patch) {
  Object.assign(state, patch);
  render(); // render solo se llama desde aquí
}
```

Esto no requiere Redux ni ninguna librería — es un patrón simple aplicable en vanilla JS. El beneficio es que `render()` solo se llama desde `setState()`, haciendo el flujo de datos predecible.

---

### Ítem 6 — Suite de tests `[Media]`

**Problema:**
No hay ningún test automatizado. Cambios en la lógica de scoring, recomendaciones o filtros de datos se verifican manualmente, lo que es lento y propenso a regresiones.

**Qué testear primero (mayor ROI):**

| Función | Por qué es crítica |
|---------|-------------------|
| `getLevel(pct)` | Determina el nivel de madurez mostrado |
| `getTeamFilteredStats()` | Base de todo el análisis |
| `getMajorityRole()` | Afecta todas las recomendaciones en vista "Todos" |
| `detectPatterns()` | Lógica de patrones cruzados |
| `getContextNote()` | Notas contextuales por perfil de equipo |
| Scoring por dimensión | Cálculo central del assessment |

**Stack sugerido:** Vitest (compatible con ES modules, cero configuración) o Jest.

**Estructura:**
```
/tests
  ├── scoring.test.js
  ├── recommendations.test.js
  ├── filters.test.js
  └── patterns.test.js
```

---

### Ítem 7 — CI/CD básico `[Baja]`

**Problema:**
El deploy es manual (`firebase deploy`), sin validación previa. Un archivo con error de sintaxis puede llegar a producción.

**Solución:**
GitHub Actions workflow que en cada push a `main`:
1. Valida sintaxis JS (`eslint`)
2. Corre los tests (`vitest run`)
3. Solo si pasan → `firebase deploy`

```yaml
# .github/workflows/deploy.yml
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm test
      - run: npx firebase deploy --token ${{ secrets.FIREBASE_TOKEN }}
```

---

### Ítem 8 — Paginación y queries eficientes `[Baja]`

**Problema:**
`fetchAllData()` carga **todas** las respuestas de Firestore en cada actualización (`db.collection('respuestas').get()`). Con 10 equipos y 5 ciclos, esto puede ser miles de documentos. Firestore cobra por lectura por documento.

**Solución:**
- Paginación en la lista de respuestas (Firestore `limit()` + `startAfter()`)
- Query por ciclo activo por defecto en lugar de cargar todo
- `onSnapshot()` para actualizaciones en tiempo real solo cuando el admin está activo en la pestaña

---

### Ítem 9 — Auditoría y observabilidad `[Baja]`

**Problema:**
No hay registro de acciones críticas: quién creó un equipo, quién exportó datos, cuándo se suspendió un usuario.

**Solución:**
Colección `auditLog` en Firestore:
```js
{
  accion: 'crear_equipo' | 'suspender_usuario' | 'exportar_csv' | ...,
  realizadoPor: uid,
  detalles: { ... },
  timestamp: serverTimestamp()
}
```

Solo se escribe desde Cloud Functions (no desde el cliente) para garantizar integridad.

---

## Resumen por fase

| Fase | Ítem | Prioridad | Esfuerzo estimado |
|------|------|-----------|-------------------|
| 1 — Seguridad | Firestore rules con validación real | 🔴 Alta | Horas |
| 1 — Seguridad | Cloud Function para gestión de usuarios | 🔴 Alta | 1–2 días |
| 2 — Arquitectura | Separar código en archivos | 🟡 Media | 1 día |
| 2 — Arquitectura | Migrar a Vue 3 o mejorar vanilla JS | 🟡 Media | 3–5 días |
| 2 — Arquitectura | Estado centralizado | 🟡 Media | 1 día |
| 3 — Confiabilidad | Tests de lógica crítica | 🟡 Media | 2–3 días |
| 3 — Confiabilidad | CI/CD básico con GitHub Actions | 🟢 Baja | Horas |
| 4 — Escala | Paginación y queries eficientes | 🟢 Baja | 1–2 días |
| 4 — Escala | Auditoría y observabilidad | 🟢 Baja | 1 día |

---

## Lo que NO cambiaría ahora

- **Firebase Hosting** — sigue siendo la opción correcta para este tipo de app
- **Firestore** — adecuado para el modelo de datos actual
- **`assessment-config.js`** — la separación de configuración ya es buena práctica
- **La UX y el diseño visual** — funcionan bien, no requieren cambios arquitecturales

---

## Estado

| Ítem | Estado | Notas |
|------|--------|-------|
| 1 — Firestore rules server-side | ✅ Completado | `firestore.rules` versionado en el repo, validación de `ownerId` y `isSuperAdmin()` server-side |
| 2 — Cloud Function usuarios | ✅ Completado | `createWorkspaceAdmin` + `deleteWorkspaceAdmin` en `functions/index.js`, plan Blaze activado |
| 3 — Separar en archivos | ✅ Completado | `assets/` con admin.css, admin-state.js, admin-api.js, admin-render.js, admin-export.js, admin-auth.js |
| 4 — Framework de componentes | Pendiente | |
| 5 — Estado centralizado | ✅ Completado | `state` object + `setState(patch)` en admin-state.js; render() solo se llama desde setState |
| 6 — Tests | ✅ Completado | Vitest; 59 tests en `tests/scoring.test.js`, `analysis.test.js`, `evolution.test.js`; CJS stubs en `assessment-config.js` y `admin-api.js` |
| 7 — CI/CD | ✅ Completado | `.github/workflows/deploy.yml`: job `test` (lint+vitest, push+PRs) → job `deploy` (solo push a main); requiere secret `FIREBASE_TOKEN` |
| 8 — Paginación | Pendiente | |
| 9 — Auditoría | Pendiente | |
