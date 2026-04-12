# Plan de Mejoras V4 — Solidez metodológica del instrumento

Mejoras identificadas en el análisis del 2026-04-12 realizado desde la perspectiva de un Agile coach experto usando la herramienta con clientes corporativos reales. El objetivo de este plan es cerrar los gaps metodológicos que un coach o cliente sofisticado puede detectar en la primera sesión de debrief.

**9 mejoras en 3 niveles de prioridad.**

---

## Resumen ejecutivo

| Prioridad | Mejoras | Estado |
|-----------|---------|--------|
| Alta | #A Perspectiva SM · #B Nivel Avanzado · #C Pregunta impedimentos | ✅ Completada 2026-04-12 |
| Media | #D No aplica técnico · #E Alerta inconsistencia score-comentario · #F Benchmark segmentado | ⏳ Pendiente |
| Baja | #G Salud del equipo · #H Ponderación preguntas · #I Guía de llenado individual | ⏳ Pendiente |

---

## Prioridad Alta — completada ✅

### #A. Perspectiva propia del Scrum Master ✅ `4c2f8ad`

**Problema:**
`RECS_ROLE` tenía entradas para Product Owner y Dev Team con recomendaciones diferenciadas por rol. El SM respondía el assessment pero recibía recomendaciones genéricas en lugar de perspectivas orientadas a su rol como facilitador y servant leader.

**Solución:**
`RECS_ROLE['Scrum Master']` — 6 dimensiones × 4 niveles de madurez = 24 textos con perspectiva de coaching sistémico, facilitación y remoción de impedimentos.

**Nota:** La entrada SM ya existía en el código desde V3, pero solo tenía 3 niveles. Esta mejora la completó con el 4º nivel Avanzado (ver #B).

---

### #B. 4ª recomendación para el nivel Avanzado ✅ `4c2f8ad`

**Problema:**
`getRec` usaba `idx = pct <= 33 ? 0 : pct <= 66 ? 1 : 2`. Los equipos en nivel Avanzado (83–100%) recibían las mismas recomendaciones que los Maduros (66–82%). Un equipo con 3 años de Scrum y score de 90% leía recomendaciones sobre "establecer ceremonias básicas".

**Solución:**
- `getRec` actualizado: `idx = pct <= 33 ? 0 : pct <= 66 ? 1 : pct <= 82 ? 2 : 3`
- 4ª entrada añadida a `RECS[dim]` para las 6 dimensiones — contenido orientado a DORA metrics, Continuous Discovery, Team Topologies, OKRs y escalar más allá de Scrum
- 4ª entrada añadida a `RECS_ROLE[rol][dim]` para PO, Dev Team y SM × 6 dimensiones
- Tests: 94 → 96 (2 nuevos: `pct=82 → idx 2`, `pct=83 → idx 3`)

---

### #C. Pregunta sobre gestión de impedimentos ✅ `4c2f8ad`

**Problema:**
La gestión de impedimentos es el indicador más discriminante de la madurez de un SM y de la salud del sistema Scrum. No había ninguna pregunta que la capturara. Un equipo con ceremonias perfectas puede colapsar por impedimentos crónicos sin resolución.

**Solución:**
Nueva pregunta añadida a la sección Transparencia (4ª pregunta):

> *"¿El equipo identifica y escala los impedimentos para que se resuelvan dentro del Sprint?"*

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

## Prioridad Media — pendiente ⏳

### #D. Flag "dimensión no aplica" para Excelencia Técnica

**Problema:**
Equipos de marketing agile, legal, finanzas o research usan Scrum pero no tienen CI/CD ni pruebas automatizadas. Para ellos, las 3 preguntas de Excelencia Técnica siempre darán 0 y bajarán el score total artificialmente. No hay mecanismo para indicar que la dimensión no aplica a su contexto.

**Solución propuesta:**
- Selector en la pantalla de inicio del formulario: *"¿El equipo trabaja en desarrollo de software?"* (Sí / No)
- Si "No": la sección de Excelencia Técnica se sustituye por 3 preguntas alternativas sobre gestión de calidad del trabajo de conocimiento (revisiones entre pares, criterios de aceptación de entregables, gestión de la deuda de proceso)
- En el admin: badge "No-tech" en la tarjeta del equipo, excluir del benchmark de Excelencia Técnica org-wide si hay mezcla de tipos

**Complejidad:** Media
**Dependencias:** Añadir campo `teamType` en `respuestas`; actualizar `SECTIONS` con rama condicional; actualizar `DIMS` para que el max de técnico sea dinámico

---

### #E. Alerta de inconsistencia score-comentario

**Problema:**
Un equipo puede dar score 3 en todas las preguntas de Ceremonias y dejar comentarios como "las retros son un teatro" o "nadie entiende el Goal". Esa contradicción es la señal más valiosa que busca un coach experto, pero la herramienta no la detecta ni alerta. Los comentarios solo son visibles si el coach abre el panel manualmente.

**Solución propuesta:**
Función `detectCommentRisk(teamResps, dimScores)` en `admin-api.js`:
- Si score promedio de una sección es ≥ 2 (67%+) pero existe algún comentario con términos de riesgo definidos (`['teatro', 'vacía', 'nadie', 'no funciona', 'no se usa', 'rara vez', 'nunca', 'solo de nombre', 'obligados', 'forzado']`) → badge ⚠ en el header de la sección del histograma
- Alternativamente: delegar la detección a Claude si el análisis IA está activado, añadiendo una sección `riesgosOcultos` al JSON de salida
- El badge debe ser discreto (no alarmista) y redirigir al panel de comentarios al hacer clic

**Complejidad:** Baja (detección por keywords) / Media (via IA)
**Dependencias:** Ninguna para la versión con keywords

---

### #F. Segmentación del benchmark por tipo de equipo

**Problema:**
El radar comparativo y el delta "+N% org" mezclan equipos de naturalezas diferentes (producto software, operaciones, marketing agile). Comparar un equipo de software con uno de conocimiento produce un benchmark engañoso, especialmente en Excelencia Técnica y Dev Team.

**Solución propuesta:**
- Campo `teamCategory` en `equipos` (Software / Conocimiento / Operaciones / Otro)
- El benchmark org en el radar solo incluye equipos de la misma categoría
- Badge de categoría en la tarjeta del equipo
- En el heatmap comparativo: agrupación visual por categoría con separador

**Complejidad:** Baja-media
**Dependencias:** Ninguna crítica; retrocompatible (sin categoría = categoría por defecto)

---

## Prioridad Baja — pendiente ⏳

### #G. Preguntas opcionales de salud del equipo

**Problema:**
La seguridad psicológica (Amy Edmondson) es el predictor más fuerte de la adopción real de los valores Scrum: coraje para dar feedback en la Retro, apertura para revelar impedimentos, compromiso real vs. cumplimiento formal. Un equipo con scores altos en todas las dimensiones técnicas de Scrum puede seguir siendo disfuncional si la confianza es baja.

**Solución propuesta:**
Sección opcional al final del formulario (solo si el workspace la activa en Configuración):
- 2–3 preguntas de escala sobre seguridad psicológica y dinámica de equipo
- No afectan el score principal de madurez Scrum — generan un `teamHealthScore` independiente
- En el admin: badge de salud en la tarjeta + input adicional al prompt de análisis IA
- Ejemplo de preguntas:
  - *"¿El equipo se siente seguro para dar feedback crítico en la Retro sin consecuencias negativas?"*
  - *"¿Los errores se tratan como oportunidades de aprendizaje, no como fallos individuales?"*

**Complejidad:** Media
**Dependencias:** Toggle en `workspaces/{id}` — retrocompatible

---

### #H. Ponderación de preguntas fundacionales

**Problema:**
Actualmente cada pregunta vale lo mismo (0–3 pts). La pregunta sobre Sprint Goal vale igual que la de WIP limits. Metodológicamente, los fundamentos de Scrum (Sprint Goal, DoD, empirismo) son prerequisito del resto. Un equipo que falla en los fundamentos pero tiene buenas prácticas de optimización obtiene un score inflado.

**Solución propuesta:**
Sistema de pesos en `SECTIONS.questions`: campo `weight` (por defecto 1.0, puede ser 1.5 para preguntas fundacionales):
- Preguntas fundacionales (weight 1.5): Sprint Goal, Definition of Done, Product Goal, valores Scrum
- Preguntas de optimización (weight 1.0): WIP limits, DORA metrics, Continuous Discovery
- `calcResults()` en el formulario multiplica el valor de respuesta por `q.weight || 1`

**Complejidad:** Media — requiere recalibrar umbrales de madurez con datos reales
**Dependencias:** Cambio de scoring → rompe comparabilidad con datos históricos. Implementar solo con ciclo nuevo

---

### #I. Guía de llenado individual en el formulario

**Problema:**
Si el coach facilita la sesión de llenado del assessment, las respuestas tienden hacia lo que el equipo cree que el coach quiere ver (sesgo del facilitador). La herramienta asume llenado individual y asíncrono, pero no hay ninguna instrucción que lo indique.

**Solución propuesta:**
- Texto en la pantalla de inicio del formulario (debajo del nombre y rol): *"Este assessment está diseñado para completarse de forma individual, sin coordinarlo con tus compañeros. Tus respuestas son anónimas y no hay respuestas correctas o incorrectas."*
- Si el workspace tiene `anonymityMode !== 'full'`, adaptar el mensaje al modo correspondiente
- Opcionalmente: un campo de nota en la pestaña Configuración del admin para que el coach personalice este texto

**Complejidad:** Muy baja
**Dependencias:** Ninguna

---

## Decisión de arquitectura — recomendaciones hardcodeadas vs. IA

Las recomendaciones que aparecen en las tarjetas de equipo (`RECS`, `RECS_ROLE`) son **100% deterministas y estáticas** — se seleccionan por `getRec(dim, pct, role)` sin ninguna llamada a la API. La IA (Claude) solo actúa cuando el coach pulsa "Analizar con IA" y genera una síntesis narrativa mucho más rica.

Esta arquitectura es intencional:
- Las recomendaciones hardcodeadas son instantáneas, sin costo de API y funcionan sin crédito disponible
- El análisis IA no reemplaza las recomendaciones — las complementa con contexto cruzado entre dimensiones, evolución, comentarios y perfil del equipo
- Cambiar las recomendaciones a IA generativa añadiría latencia y costo sin beneficio proporcional, ya que el texto de una sola dimensión aislada tiene poco contexto para que Claude aporte más que el texto estático

---

## Notas de compatibilidad

### Breaking change en scoring de Transparencia (commit `4c2f8ad`)
`DIMS.transparencia.max` cambió de 9 a 12. Los datos históricos mostrarán transparencia con un máximo efectivo de 75% en lugar de 100%. Los porcentajes totales almacenados en `respuestas.scoreTotalPct` son comparables entre sí (calculados dinámicamente), pero los scores de dimensión de transparencia anteriores al cambio serán relativamente más bajos en la vista de evolución. **Acción recomendada:** abrir un nuevo ciclo para que las comparaciones en el gráfico de evolución sean válidas.
