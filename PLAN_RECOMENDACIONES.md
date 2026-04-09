# Plan de Implementación — Recomendaciones Nivel 1 + 2

## Objetivo

Elevar el sistema de recomendaciones del panel admin desde textos estáticos por dimensión/nivel/rol hacia un sistema contextual, cruzado y conectado con acciones concretas.

---

## Orden de ejecución

```
Fase 1 — Fundación de datos
  Ítem 4 → Ítem 1 → Ítem 2

Fase 2 — Tendencias y alertas
  Ítem 3 → Ítem 6

Fase 3 — Conexión con acción
  Ítem 5

Fase 4 — Comparativa global
  Ítem 7
```

---

## Detalle por ítem

### Ítem 4 — "Todos" usa el rol mayoritario `[Baja]`

**Archivos:** `admin.html`

**Problema que resuelve:** Cuando el filtro de rol es "Todos", actualmente se usan los textos genéricos de `RECS` en lugar de los textos específicos por rol de `RECS_ROLE`. Todos los demás ítems heredan este comportamiento, por eso va primero.

**Implementación:**
- Crear `getMajorityRole(responses)` que cuenta las ocurrencias de cada rol en el subconjunto de respuestas del equipo y devuelve el rol mayoritario. Devuelve `null` si hay empate o menos de 2 respuestas.
- En `renderAnalysis()` línea ~682: reemplazar `const roleForRec = selectedRole === 'Todos' ? null : selectedRole` por una llamada a `getMajorityRole(filtered)`.
- Añadir nota discreta bajo el label de recomendaciones: *"Basado en el rol mayoritario (Dev Team)"*.
- Aplicar el mismo cambio en `renderEvolution()` línea ~833.

**Resultado esperado:** Las recomendaciones en vista "Todos" son específicas al rol más representado del equipo, no un fallback genérico.

---

### Ítem 1 — Contexto del equipo `[Media]`

**Archivos:** `assessment-config.js` + `admin.html`

**Problema que resuelve:** Los campos `tamanoEquipo` y `tiempoScrum` se guardan en Firestore pero nunca se usan en las recomendaciones. Un equipo nuevo de 10 personas tiene desafíos distintos a uno maduro de 4.

**Implementación:**
- En `assessment-config.js`: añadir función `getContextNote(dim, pct, tamano, tiempoScrum)` que devuelve una nota corta (string) o `null`. Reglas iniciales:
  - `tiempoScrum === '<6 meses'` + cualquier dimensión baja → *"Equipo nuevo: priorizar cadencia básica antes que optimización"*
  - `tamanoEquipo === '10+'` + Ceremonias baja → *"Equipo grande: la coordinación a escala requiere estructura explícita en los eventos"*
  - `tamanoEquipo === '1–5'` + DevTeam baja → *"Equipo pequeño: la cross-funcionalidad es crítica para no generar cuellos de botella"*
- En `admin.html`, función `getTeamFilteredStats()`: calcular la moda de `tamanoEquipo` y `tiempoScrum` del subconjunto filtrado y añadirlos al objeto retornado.
- En `renderAnalysis()`: en cada `rec-item`, si `getContextNote()` devuelve texto, añadirlo como nota en estilo amber debajo de la recomendación principal.

**Resultado esperado:** Cada recomendación puede ir acompañada de una nota contextual que personaliza el consejo según las características del equipo.

---

### Ítem 2 — Análisis cruzado de dimensiones `[Media]`

**Archivos:** `assessment-config.js` + `admin.html`

**Problema que resuelve:** Las recomendaciones son independientes por dimensión. Cuando múltiples dimensiones bajas co-ocurren hay un patrón sistémico que merece un diagnóstico diferente al de cada dimensión por separado.

**Implementación:**
- En `assessment-config.js`: definir estructura `CROSS_PATTERNS` — array de objetos con `{ dims, maxPct, label, text }`. Patrones iniciales:

  | Patrón | Condición | Label |
  |--------|-----------|-------|
  | Base Scrum débil | Ceremonias + Transparencia < 50% | Estructura básica ausente |
  | Madurez técnica baja | Dev Team + Exc. Técnica < 45% | Limitación técnica sistémica |
  | Desconexión del valor | Backlog + Orient. Cliente < 45% | El equipo construye sin validar |
  | Adopción inicial total | Todas las dimensiones < 40% | Scrum en fase muy inicial |

- En `assessment-config.js`: crear función `detectPatterns(dimScores)` que recibe `{eventos: {pct:X}, ...}` y devuelve los patrones activos como array.
- En `admin.html`, función `renderAnalysis()`: añadir bloque *"Patrón detectado"* (badge amber, colapsable) antes del bloque de recomendaciones individuales si `detectPatterns()` devuelve al menos un patrón.

**Resultado esperado:** El admin ve de un vistazo si el equipo tiene un problema sistémico identificable, no solo dimensiones sueltas bajas.

---

### Ítem 3 — Recomendaciones con tendencia `[Baja]`

**Archivos:** `admin.html` (función `renderEvolution()`)

**Problema que resuelve:** Actualmente la pestaña Evolución detecta retrocesos pero solo añade un prefijo de texto. No reconoce el progreso ni diferencia la urgencia visualmente.

**Implementación:**
- Cuando `pct > prevPct` pero `pct < 60` (subió pero sigue siendo área de mejora): añadir nota *"Mejora detectada: +X% vs. ciclo anterior. Mantener el foco."* en color verde.
- Cuando `regressed === true` (`pct < prevPct`): envolver el `rec-item` completo con borde rojo y clase `rec-item--urgent` en lugar de solo el prefijo de texto actual.
- Cuando `prevPct === null` (solo un ciclo): no mostrar ningún indicador de tendencia.

**Resultado esperado:** La vista de Evolución diferencia visualmente si una dimensión está mejorando, estancada o en retroceso, con urgencia explícita en el último caso.

---

### Ítem 6 — Badge "Crítica" `[Baja]`

**Archivos:** `admin.html` (función `renderAnalysis()`)

**Problema que resuelve:** Todas las recomendaciones tienen el mismo peso visual. El admin no sabe de un vistazo cuál dimensión requiere atención inmediata.

**Implementación:**
- Versión simple: si la dimensión más baja del equipo tiene `pct < 33`, añadir badge rojo *"Crítica"* en su `rec-item` antes de las demás.
- Máximo un badge "Crítica" por tarjeta de equipo.
- Añadir clase `no-print` para que no aparezca en el PDF exportado.

**Resultado esperado:** El admin identifica en segundos si hay una dimensión crítica sin leer todos los textos.

---

### Ítem 5 — Botón "Agregar al Plan de Acción" `[Media]`

**Archivos:** `admin.html`

**Problema que resuelve:** Las recomendaciones y el Plan de Acción son funcionalidades desconectadas. El admin tiene que leer la recomendación, memorizarla y escribirla manualmente en el plan.

**Implementación:**
- Crear función `prefillPlan(teamId, dimKey, ciclo)` que: asigna `newPlanTeamId`, recupera el texto de `recTexts[dimKey]`, asigna `newPlanIniciativa`, cambia `activeTab = 'plan'`, llama `render()` y hace scroll a `#plan-form`.
- Almacenar los textos de recomendación en objeto temporal `recTexts = {}` durante el render (indexado por `d.key`) para no incrustar texto con comillas en atributos `onclick`.
- En cada `rec-item` de `renderAnalysis()` y `renderEvolution()`: añadir botón `+ Plan` con clase `no-print`.
- Añadir `id="plan-form"` al div del formulario en `renderPlan()`.

**Resultado esperado:** Un clic convierte una recomendación en una iniciativa del Plan de Acción con el equipo, dimensión y ciclo ya pre-completados.

---

### Ítem 7 — Comparativa vs. media global `[Alta]`

**Archivos:** `admin.html`

**Problema que resuelve:** No hay referencia externa. El admin no sabe si un equipo con 60% en Ceremonias está bien o mal respecto a los demás equipos.

**Implementación:**
- Crear función `computeGlobalDimAverages(cycleFilter)` que calcula el promedio de cada dimensión entre todos los equipos con datos en el ciclo/filtro activo (promedio de promedios, no ponderado por número de respuestas).
- Calcular una vez al inicio de `renderAnalysis()` y pasar como argumento al render de cada tarjeta.
- En cada fila de dimensión: añadir badge `+X%` (verde) o `-X%` (rojo) vs. media global.
- Ocultar el badge si hay menos de 2 equipos con datos (evitar comparar un equipo consigo mismo).

**Resultado esperado:** El admin puede comparar de un vistazo si cada dimensión de un equipo está por encima o debajo del promedio organizacional.

---

## Distribución de cambios por archivo

| Ítem | admin.html | assessment-config.js |
|------|-----------|----------------------|
| 4 — Rol mayoritario | `renderAnalysis`, `renderEvolution` | — |
| 1 — Contexto equipo | `getTeamFilteredStats`, `renderAnalysis` | Nueva `getContextNote()` |
| 2 — Análisis cruzado | `renderAnalysis` (bloque de patrones) | `CROSS_PATTERNS` + `detectPatterns()` |
| 3 — Tendencia en Evolución | `renderEvolution` | — |
| 6 — Badge Crítica | `renderAnalysis` | — |
| 5 — Botón Plan de Acción | Nueva `prefillPlan()`, `renderAnalysis`, `renderEvolution`, `renderPlan` | — |
| 7 — Comparativa global | Nueva `computeGlobalDimAverages()`, `renderAnalysis` | — |

---

## Riesgos identificados

| Riesgo | Ítems afectados | Mitigación |
|--------|----------------|------------|
| Ítem 1 genera notas con rol incorrecto si ítem 4 no está implementado primero | 1, 4 | Implementar ítem 4 antes que el 1 |
| Texto con comillas en atributos `onclick` rompe el HTML | 5 | Usar objeto `recTexts` indexado por clave; nunca incrustar texto plano |
| `computeGlobalDimAverages` re-calcula en cada render | 7 | Calcular una vez por render en variable local, no en cada tarjeta |
| Badge "Crítica" no aparece si ninguna dimensión baja de 33% | 6 | Documentar umbral y revisar si bajarlo a 40% da más utilidad |
| CSS inconsistente entre ítems 2, 3 y 6 (todos añaden estilos de alerta) | 2, 3, 6 | Reutilizar variables CSS existentes `--red`, `--amber` y definir clases compartidas al inicio |

---

## Estado

| Ítem | Estado |
|------|--------|
| 4 — Rol mayoritario | Pendiente |
| 1 — Contexto equipo | Pendiente |
| 2 — Análisis cruzado | Pendiente |
| 3 — Tendencia en Evolución | Pendiente |
| 6 — Badge Crítica | Pendiente |
| 5 — Botón Plan de Acción | Pendiente |
| 7 — Comparativa global | Pendiente |
