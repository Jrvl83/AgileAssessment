# Plan de Mejoras V4 — Solidez metodológica del instrumento

Mejoras identificadas en el análisis del 2026-04-12 realizado desde la perspectiva de un Agile coach experto usando la herramienta con clientes corporativos reales. El objetivo de este plan es cerrar los gaps metodológicos que un coach o cliente sofisticado puede detectar en la primera sesión de debrief.

**9 mejoras en 3 niveles de prioridad — completado 2026-04-12.**

---

## Resumen ejecutivo

| Prioridad | Mejoras                                                                                    | Estado                             |
| --------- | ------------------------------------------------------------------------------------------ | ---------------------------------- |
| Alta      | #A Perspectiva SM · #B Nivel Avanzado · #C Pregunta impedimentos                           | ✅ Completada 2026-04-12 `4c2f8ad` |
| Media     | #D No aplica técnico · #E Alerta inconsistencia score-comentario · #F Benchmark segmentado | ✅ Completada 2026-04-12 `6b34da4` |
| Baja      | #G Salud del equipo · #H Ponderación preguntas · #I Guía de llenado individual             | ✅ Completada 2026-04-12 `cb5dafc` |

---

## Prioridad Alta — completada ✅ `4c2f8ad`

### #A. Perspectiva propia del Scrum Master ✅

**Problema:**
`RECS_ROLE` tenía entradas para Product Owner y Dev Team con recomendaciones diferenciadas por rol. El SM respondía el assessment pero recibía recomendaciones genéricas en lugar de perspectivas orientadas a su rol como facilitador y servant leader.

**Solución:**
`RECS_ROLE['Scrum Master']` — 6 dimensiones × 4 niveles de madurez = 24 textos con perspectiva de coaching sistémico, facilitación y remoción de impedimentos.

**Nota:** La entrada SM ya existía en el código desde V3, pero solo tenía 3 niveles. Esta mejora la completó con el 4º nivel Avanzado (ver #B).

---

### #B. 4ª recomendación para el nivel Avanzado ✅

**Problema:**
`getRec` usaba `idx = pct <= 33 ? 0 : pct <= 66 ? 1 : 2`. Los equipos en nivel Avanzado (83–100%) recibían las mismas recomendaciones que los Maduros (66–82%). Un equipo con 3 años de Scrum y score de 90% leía recomendaciones sobre "establecer ceremonias básicas".

**Solución:**

- `getRec` actualizado: `idx = pct <= 33 ? 0 : pct <= 66 ? 1 : pct <= 82 ? 2 : 3`
- 4ª entrada añadida a `RECS[dim]` para las 6 dimensiones — contenido orientado a DORA metrics, Continuous Discovery, Team Topologies, OKRs y escalar más allá de Scrum
- 4ª entrada añadida a `RECS_ROLE[rol][dim]` para PO, Dev Team y SM × 6 dimensiones
- Tests: 94 → 96 (2 nuevos: `pct=82 → idx 2`, `pct=83 → idx 3`)

---

### #C. Pregunta sobre gestión de impedimentos ✅

**Problema:**
La gestión de impedimentos es el indicador más discriminante de la madurez de un SM y de la salud del sistema Scrum. No había ninguna pregunta que la capturara. Un equipo con ceremonias perfectas puede colapsar por impedimentos crónicos sin resolución.

**Solución:**
Nueva pregunta añadida a la sección Transparencia (4ª pregunta):

> _"¿El equipo identifica y escala los impedimentos para que se resuelvan dentro del Sprint?"_

Opciones conductuales (0–3 pts):

- 0: Los impedimentos no se identifican o permanecen bloqueados varias semanas sin dueño
- 1: Se mencionan en el Daily pero nadie los escala; el equipo los asume como parte del trabajo
- 2: La mayoría se escalan y se resuelven, aunque algunos quedan sin seguimiento
- 3: Los impedimentos se identifican, escalan y resuelven sistemáticamente antes de que bloqueen el Sprint Goal

**Impacto en scoring:**

- `DIMS.transparencia.max`: 9 → 12 (4 preguntas × 3 pts)
- Total máximo del assessment: 60 → 63 pts
- `calcResults()` en el formulario ya era dinámico — sin hardcoded. No requirió cambios en `assessment-agile.html`
- **Nota para el coach:** respuestas anteriores al 2026-04-12 mostrarán transparencia con un máximo de 75% (9/12). Se recomienda iniciar un nuevo ciclo para datos comparables

---

## Prioridad Media — completada ✅ `6b34da4`

### #D. Flag "dimensión no aplica" para Excelencia Técnica ✅

**Problema:**
Equipos de marketing agile, legal, finanzas o research usan Scrum pero no tienen CI/CD ni pruebas automatizadas. Para ellos, las 3 preguntas de Excelencia Técnica siempre darán 0 y bajarán el score total artificialmente. No hay mecanismo para indicar que la dimensión no aplica a su contexto.

**Solución implementada:**

- Selector "¿El equipo trabaja en desarrollo de software?" (Sí / No) en la pantalla de contexto del formulario. Badge "Adapta las preguntas técnicas" junto al selector.
- Si "No": la sección de Excelencia Técnica muestra 3 preguntas alternativas sobre gestión de calidad del trabajo de conocimiento (revisiones entre pares, criterios de aceptación de entregables, deuda de proceso)
- Las preguntas alternativas usan las mismas keys (`tecnico_0/1/2`) — scoring e histogramas del admin funcionan sin modificación
- Campo `teamType` guardado en `respuestas` ('software' | 'knowledge' — vacío = no especificado)
- En el admin: badge "No-software" (azul) en el header de la sección Excelencia Técnica en el panel de detalle por pregunta

---

### #E. Alerta de inconsistencia score-comentario ✅

**Problema:**
Un equipo puede dar score 3 en todas las preguntas de Ceremonias y dejar comentarios como "las retros son un teatro" o "nadie entiende el Goal". Esa contradicción es la señal más valiosa que busca un coach experto, pero la herramienta no la detecta ni alerta.

**Solución implementada:**
Función `detectCommentRisk(teamResps, dimAvgPcts)` en `admin-api.js` (versión keywords, sin IA):

- Si el porcentaje promedio de una dimensión es ≥ 67% pero existe algún comentario con términos de riesgo → badge ⚠ "Señal oculta" (ámbar) en el header de la sección en el panel de detalle
- Términos de riesgo: `['teatro','vacía','vacío','nadie','no funciona','no se usa','rara vez','nunca','solo de nombre','obligados','forzado','forzada','no sirve']`
- El badge es discreto y no bloquea el flujo — solo llama la atención del coach

---

### #F. Segmentación del benchmark por tipo de equipo ✅

**Problema:**
El radar comparativo mezclaba equipos de naturalezas diferentes. Comparar un equipo de software con uno de conocimiento produce un benchmark engañoso, especialmente en Excelencia Técnica y Dev Team.

**Solución implementada:**

- Campo `category` en colección `equipos` (Software / Conocimiento / Operaciones / Otro)
- Selector de categoría por equipo en la pestaña Equipos del admin
- El benchmark org en el radar solo incluye equipos de la misma categoría si hay ≥2 equipos en ella; si no, usa el benchmark org completo como fallback
- Badge de categoría en la tarjeta del equipo en Análisis
- El delta "% org" en el header muestra el nombre de la categoría cuando aplica el benchmark segmentado

---

## Prioridad Baja — completada ✅ `cb5dafc`

### #G. Preguntas opcionales de salud del equipo ✅

**Problema:**
La seguridad psicológica (Amy Edmondson) es el predictor más fuerte de la adopción real de los valores Scrum. Un equipo con scores altos en todas las dimensiones técnicas de Scrum puede seguir siendo disfuncional si la confianza es baja.

**Solución implementada:**
Sección opcional al final del formulario (activable por workspace en Configuración):

- 3 preguntas de escala sobre seguridad psicológica:
  - _"¿El equipo se siente seguro para dar feedback crítico en la Retro sin consecuencias negativas?"_
  - _"¿Los errores se tratan como oportunidades de aprendizaje, no como fallos individuales?"_
  - _"¿Los miembros del equipo pueden plantear problemas o preocupaciones sin temor a represalias?"_
- Genera `teamHealthScore` independiente (0–100%), no afecta el score de madurez Scrum
- Respuestas guardadas en `healthAnswers` separado
- En el admin: badge de salud en la tarjeta de equipo (Alta ≥70% / Media ≥40% / Baja <40%)
- Toggle "Activar preguntas de salud del equipo" en pestaña Configuración

---

### #H. Ponderación de preguntas fundacionales ✅

**Problema:**
Actualmente cada pregunta valía lo mismo (0–3 pts). La pregunta sobre Sprint Goal valía igual que la de WIP limits. Los fundamentos de Scrum son prerequisito del resto — un equipo que falla en los fundamentos pero tiene buenas prácticas de optimización obtenía un score inflado.

**Solución implementada:**
Campo `weight` en `SECTIONS.questions` (por defecto 1.0):

- Preguntas fundacionales con `weight: 1.5`: Sprint Goal (eventos_0), Product Goal (backlog_2), Definition of Done (devteam_1), valores Scrum (transparencia_2)
- `calcResults()` en el formulario aplica el peso: `wSum += (answers[qKey] || 0) * w`
- **Normalización:** el score se normaliza de vuelta a la escala `DIMS.max` original: `score = Math.round(wSum / wMax * dimMax)`. Esto preserva la comparabilidad con datos históricos — los scores almacenados siguen en el rango 0–12/9 original
- Sin breaking change en datos históricos ni en los 96 tests existentes

---

### #I. Guía de llenado individual en el formulario ✅

**Problema:**
Si el coach facilita la sesión de llenado en grupo, las respuestas tienden hacia lo que el equipo cree que el coach quiere ver (sesgo del facilitador). La herramienta asumía llenado individual y asíncrono, pero no lo indicaba.

**Solución implementada:**

- Bloque de guía en la pantalla de inicio del formulario, adaptado al `anonymityMode`:
  - **Anónimo total:** _"Para obtener resultados útiles, responde de forma individual, sin coordinar con tus compañeros. Tus respuestas son completamente anónimas."_
  - **Semi-anónimo / Nominal:** adapta el mensaje al modo configurado, manteniendo el foco en la independencia de las respuestas
- Campo `guidanceText` en `workspaces`: si el coach lo personaliza desde Configuración, reemplaza el texto por defecto
- Complejidad de implementación: muy baja

---

## Decisión de arquitectura — recomendaciones hardcodeadas vs. IA

Las recomendaciones que aparecen en las tarjetas de equipo (`RECS`, `RECS_ROLE`) son **100% deterministas y estáticas** — se seleccionan por `getRec(dim, pct, role)` sin ninguna llamada a la API. La IA (Claude) solo actúa cuando el coach pulsa "Analizar con IA" y genera una síntesis narrativa mucho más rica.

Esta arquitectura es intencional:

- Las recomendaciones hardcodeadas son instantáneas, sin costo de API y funcionan sin crédito disponible
- El análisis IA no reemplaza las recomendaciones — las complementa con contexto cruzado entre dimensiones, evolución, comentarios y perfil del equipo
- Cambiar las recomendaciones a IA generativa añadiría latencia y costo sin beneficio proporcional

---

## Notas de compatibilidad

### Breaking change en scoring de Transparencia (commit `4c2f8ad`)

`DIMS.transparencia.max` cambió de 9 a 12. Los datos históricos mostrarán transparencia con un máximo efectivo de 75% en lugar de 100%. Los porcentajes totales almacenados en `respuestas.scoreTotalPct` son comparables entre sí (calculados dinámicamente), pero los scores de dimensión de transparencia anteriores al cambio serán relativamente más bajos en la vista de evolución. **Acción recomendada:** abrir un nuevo ciclo para que las comparaciones en el gráfico de evolución sean válidas.

### Sin breaking change en scoring general (commit `cb5dafc`)

El sistema de ponderación de #H normaliza los scores de vuelta a la escala `DIMS.max` original — los valores almacenados en Firestore (`scoreEventos`, `scoreDevTeam`, etc.) siguen en su rango histórico. Los 96 tests del scoring pasan sin modificación. Los datos de ciclos anteriores son comparables directamente con los nuevos en la vista de Evolución.
