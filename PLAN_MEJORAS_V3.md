# Plan de Mejoras V3 — Herramienta de coaching profesional

Propuestas para elevar la herramienta de **acompañamiento de coaching** a **instrumento de diagnóstico metodológicamente sólido**, cerrando los gaps identificados desde la perspectiva de un Agile coach que la usa con clientes corporativos reales.

**9 mejoras organizadas en 4 fases.** La IA (Claude API) es un componente dado de la Fase 2 en adelante y redefine cómo se implementan varias de estas mejoras.

---

## Resumen ejecutivo

| Fase | Enfoque | Mejoras | Prioridad |
|------|---------|---------|-----------|
| 1 — Credibilidad del dato | Los tres gaps que un cliente corporativo cuestionaría primero | #1, #2, #3 | ✅ Completada 2026-04-12 |
| 2 — Análisis con IA | Síntesis narrativa que reemplaza la preparación manual del coach | #4, #10 | ✅ Completada 2026-04-12 |
| 3 — Experiencia de facilitación | Integrar la herramienta en la sesión, no solo en la preparación | #6, #7 | Media-alta — Siguiente |
| 4 — Diferenciadores de mercado | Features que la colocarían por encima de herramientas enterprise | #8, #9 | Estratégica |

---

## Principios de uso de IA — optimización de llamadas

Antes de entrar en el detalle de las mejoras, estas reglas gobiernan **cómo y cuándo** se llama a la API de Claude. El objetivo es maximizar el valor de cada llamada y no generar costos innecesarios.

### Regla 1 — Trigger manual, nunca automático
La IA solo se invoca cuando el coach hace clic en "Analizar con IA". Nunca en page load, nunca al cambiar filtros, nunca al recibir una nueva respuesta. El coach decide cuándo el volumen de datos justifica el análisis.

### Regla 2 — Caché por equipo + ciclo
El resultado de cada análisis se guarda en Firestore bajo `analisis_ia/{teamId}_{ciclo}`. Si el coach abre el mismo equipo y ciclo más tarde, se muestra el resultado cacheado con su timestamp — sin nueva llamada a la API.

### Regla 3 — Indicador de desactualización
Cuando llegan nuevas respuestas después del último análisis, el panel muestra:
*"Hay 3 respuestas nuevas desde el último análisis (hace 2 días). ¿Regenerar?"*
El coach decide si el volumen nuevo justifica repetir el análisis.

### Regla 4 — Una sola llamada por análisis
Todo el contexto del equipo va en un único prompt. Claude devuelve un JSON estructurado con todas las secciones del análisis. Sin llamadas encadenadas, sin llamadas por dimensión, sin llamadas separadas para cada sección.

### Regla 5 — Contexto trimado: datos calculados, no documentos crudos
El prompt no envía los documentos Firestore en bruto. Envía los datos ya procesados por la lógica existente: scores por dimensión, gaps detectados, momentum, patrones cruzados, comentarios por sección. Esto mantiene el input en ~2.000–2.500 tokens y reduce el costo por llamada.

### Regla 6 — La IA no reemplaza la lógica determinista
Scoring, cálculo de gaps (`detectRoleGaps`), momentum (`calcMomentum`) y detección de patrones (`CROSS_PATTERNS`) permanecen en código. Son correctos, rápidos y gratuitos. La IA recibe esos resultados como input y los sintetiza en narrativa. No los recalcula.

### Regla 7 — Fallback a recomendaciones hardcodeadas
Si la llamada a la API falla (timeout, error, cuenta sin crédito), la herramienta sigue funcionando con las recomendaciones estáticas de `RECS`. La IA es una capa aditiva, no un punto único de fallo.

---

## Fase 1 — Credibilidad del dato

Los tres gaps que hacen que un coach no pueda presentar los resultados con confianza metodológica ante un cliente que pregunta *"¿qué tan fiables son estos datos?"*. Son quick wins con alto impacto de percepción y **son prerequisito para que el análisis de IA sea útil** — sin contexto del equipo y sin datos de participación, el prompt a Claude tiene información incompleta.

---

### #1. Contexto del equipo en el formulario ✅ `233b13e`

**Problema:**
El assessment produce un score de 55% pero el coach no sabe si es un equipo de 2 meses o de 3 años, de 4 personas o de 12, con PO dedicado o compartido, distribuido o presencial. Sin ese contexto, interpretar el score es especulación. Un 55% para un equipo recién formado es sobresaliente; para uno con 2 años de Scrum es señal de estancamiento.

**Además:** sin el perfil del equipo, el análisis de IA no puede contextualizar su narrativa ni comparar contra equipos similares (#8).

**Solución:**
Pantalla de contexto al inicio del formulario (antes de las preguntas), con 4 campos cortos que el participante completa en menos de 30 segundos.

**Campos propuestos:**
- ¿Cuánto tiempo lleva este equipo trabajando con Scrum? (< 3 meses / 3–12 meses / 1–2 años / > 2 años)
- ¿Cuántas personas hay en el equipo? (3–5 / 6–8 / 9+)
- ¿El Product Owner tiene dedicación exclusiva a este equipo? (Sí / No / Compartido con otro equipo)
- ¿El equipo trabaja de forma distribuida o remota? (Presencial / Híbrido / Totalmente remoto)

**En el panel admin:**
- Resumen de contexto en la tarjeta del equipo (moda de respuestas del ciclo): *"Equipo de 6–8 personas · 1–2 años con Scrum · PO compartido · Híbrido"*
- Filtrar el heatmap comparativo por perfil de equipo

**Impacto para el coach:**
- Puede interpretar el score con narrativa en lugar de solo dar un número
- Permite comparaciones internas más justas (no comparar un equipo de 2 meses con uno de 3 años)
- El perfil se convierte en input clave del análisis de IA (#10)

**Implementación sugerida:**
- Campos en la colección `respuestas`: `teamAge`, `teamSize`, `dedicatedPO`, `workMode`
- Pantalla intermedia en `assessment-agile.html` entre el briefing y la sección 1
- Sección "Perfil del equipo" en la tarjeta de análisis (moda de los campos del ciclo actual)
- Los campos son opcionales para no bloquear la respuesta si alguien los salta

**Complejidad:** Baja-media
**Dependencias:** Ninguna

---

### #2. Panel de participación por rol con indicadores de validez ✅ `a4096e8`

**Problema:**
Si de un equipo de 8 personas solo respondieron 2 Dev Team y 1 PO, el análisis de brechas de percepción no es estadísticamente válido. Actualmente el panel no alerta sobre este riesgo. Si el coach pide un análisis de IA con esos datos, Claude recibirá gaps calculados con N insuficiente y los presentará como hallazgos reales.

**Solución:**
Panel de participación visible antes del radar, con semáforo de validez por rol. El coach decide si esperar más respuestas antes de pedir el análisis.

**Diseño propuesto:**
```
Participación — Ciclo Q2 2026
  Dev Team      ████████ 5 resp.  ✅ Válido para análisis de brechas
  Product Owner   ██░░░░ 1 resp.  ⚠️ Insuficiente (mín. 3)
  Scrum Master    ████░░ 2 resp.  ⚠️ Insuficiente (mín. 3)
  Otro            ██░░░░ 1 resp.  —
  Total: 9 respuestas
```

**Reglas del semáforo:**
- ✅ Verde: ≥ 3 respuestas por rol → análisis de brecha válido
- ⚠️ Ámbar: 1–2 respuestas → rol visible con advertencia en el gráfico
- 🔴 Rojo: 0 respuestas → rol no aparece en el desglose
- Si el total es < 3, el botón "Analizar con IA" aparece deshabilitado con tooltip explicativo

**Impacto para el coach:**
- Sabe cuándo esperar antes de solicitar el análisis
- Evita que la IA genere narrativa basada en datos insuficientes
- Puede comunicar al cliente la validez estadística de cada conclusión

**Implementación sugerida:**
- Componente `renderParticipationPanel(tid, cycleFilter)` en `admin-render.js`
- El umbral `MIN_ROLE_RESPONSES` ya existe en `admin-api.js` — reutilizar
- El botón de análisis IA (#10) lee el estado del semáforo antes de habilitar la llamada

**Complejidad:** Baja
**Dependencias:** Ninguna — la información ya está en Firestore

---

### #3. Anonimato explícito, configurable y verificable por el participante ✅ `ffdfbfc`

**Problema:**
Existe un briefing configurable (V2 #5) pero el anonimato no está explícitamente garantizado en el formulario. En culturas corporativas con baja confianza, si los participantes sospechan que sus respuestas son trazables, responderán de forma conservadora. El campo `participante` en Firestore guarda un nombre libre, lo que crea ambigüedad real.

**Además:** con la integración de IA, algunos participantes podrían preocuparse por que "sus comentarios se le pasen a una IA". Esto necesita ser transparente.

**Solución:**
Tres cambios coordinados:

1. **En el formulario:** Banner persistente en el footer del assessment:
   *"Tus respuestas son anónimas. Solo se analizan resultados agregados por rol."*
   El campo "nombre" se renombra a "identificador de rol" (ej: Dev1, Dev2).

2. **En el admin:** Configuración de nivel de anonimato por workspace:
   - **Modo anónimo total:** Solo se guarda el rol, sin nombre. (Por defecto)
   - **Modo semi-anónimo:** Se guarda un identificador pero el coach ve solo rol + número
   - **Modo nominal:** El coach ve el nombre. Solo para autoevaluaciones individuales.

3. **Transparencia sobre IA:** Si el workspace tiene IA activa, el formulario muestra:
   *"Los comentarios pueden ser analizados de forma agregada por inteligencia artificial para generar recomendaciones de coaching. Nunca se identifican autores individuales."*
   El coach puede desactivar este aviso si decide no usar la funcionalidad de IA.

**Impacto para el coach:**
- Puede mostrar a los participantes exactamente qué es y no es visible, incluyendo el uso de IA
- Diferenciador de confianza frente a clientes con contratos de confidencialidad
- El modo de anonimato condiciona qué datos se incluyen en el prompt de IA

**Implementación sugerida:**
- Campo `anonymityMode` en `workspaces/{ownerId}`: `'full' | 'semi' | 'nominal'`
- Campo `aiEnabled: true/false` en `workspaces/{ownerId}`
- En `assessment-agile.html`: footer sticky con mensaje adaptado al modo activo
- Selector en pestaña Configuración del panel admin

**Complejidad:** Media
**Dependencias:** V2 #5 (briefing — ya implementada)

---

## Fase 2 — Análisis con IA

El corazón de esta fase es una única Cloud Function que recibe el contexto completo de un equipo y devuelve un análisis narrativo estructurado. Reemplaza la mejora #5 del borrador anterior (interpretación contextual basada en tablas de referencia hardcodeadas) por algo cualitativamente superior: razonamiento cruzado sobre todos los factores simultáneamente.

---

### #4. Comentarios libres — capa de visualización ✅ `325f30a`

**Contexto del cambio respecto al borrador anterior:**
En el borrador original, esta mejora incluía análisis de frecuencia de palabras (stopwords, conteo de tokens). Con la IA integrada (#10), esa responsabilidad pasa a Claude. Esta mejora se simplifica a **solo la capa de visualización** — mostrar bien los datos cualitativos que ya existen.

**Problema:**
Los comentarios libres son el dato cualitativo más rico del assessment y en la práctica muchos coaches los ignoran porque son un muro de texto sin estructura. No hay forma de saber qué sección generó más comentarios ni navegar por ellos eficientemente.

**Solución:**
Panel de visualización de comentarios estructurado, sin lógica de análisis (eso lo hace la IA):

1. **Badge de densidad por sección:** Número de comentarios recibidos en el header de cada sección del histograma. Las secciones con más comentarios señalan dónde hay energía del equipo.

2. **Panel colapsable por sección:** Comentarios del ciclo actual como tarjetas de texto, con etiqueta de rol (sin nombre). Ordenados por sección, no como lista plana.

3. **Exportación de comentarios:** Sección de comentarios incluida en el PDF y en el PPT, agrupada por dimensión.

**Lo que NO hace esta mejora (lo hace #10):**
- Síntesis temática de los comentarios
- Identificación de patrones o tensiones entre roles
- Palabras clave o temas frecuentes

**Impacto para el coach:**
- Los comentarios son accesibles y navegables en menos de 1 minuto
- El badge de densidad es un indicador inmediato de dónde hay más para explorar
- La síntesis detallada llega vía IA al pulsar "Analizar"

**Implementación sugerida:**
- Función `groupCommentsBySection(teamResps)` en `admin-api.js`
- Panel `renderCommentsPanel(tid, cycleFilter)` en `admin-render.js`
- Badge numérico reutiliza los conteos del histograma ya existente

**Complejidad:** Baja
**Dependencias:** Ninguna

---

### #10. Análisis de IA — síntesis narrativa del equipo ✅ `b7c7a00`

**Este es el cambio más significativo del plan V3.** Reemplaza completamente la mejora #5 del borrador anterior (interpretación por tablas hardcodeadas) con análisis dinámico y contextualizado.

**Problema que resuelve:**
La preparación de una sesión de debrief con los datos actuales toma 1–2 horas: leer scores, cruzar con evolución, leer comentarios, detectar patrones, formular hipótesis, pensar qué preguntar primero. Ese trabajo es exactamente lo que un LLM puede hacer en segundos.

**Solución:**
Una Cloud Function `analyzeTeamWithClaude(teamId, ciclo)` que:

**Input al prompt (datos ya calculados por la lógica existente):**
```
- Perfil del equipo: antigüedad, tamaño, PO dedicado, modalidad
- Scores por dimensión (%) del ciclo actual
- Patrones cruzados detectados por CROSS_PATTERNS
- Brechas de percepción por rol (detectRoleGaps)
- Momentum: dirección y delta promedio (calcMomentum)
- Benchmark org: delta vs. promedio del workspace
- Comentarios por sección, etiquetados por rol (sin nombres)
- Evolución: últimos 3 ciclos por dimensión (si existen)
```
Input estimado: ~2.000–2.500 tokens

**Output de Claude (JSON estructurado):**
```json
{
  "narrativa": "2–3 párrafos de análisis de coaching integrado...",
  "focusSesion": [
    { "dimension": "backlog", "razon": "...", "prioridad": 1 },
    { "dimension": "transparencia", "razon": "...", "prioridad": 2 }
  ],
  "agendaSesion": "Borrador de agenda de 90 minutos con timing...",
  "sinteisComentarios": {
    "eventos": "Síntesis temática de los comentarios de esta sección...",
    "backlog": "..."
  },
  "resumenEjecutivo": "1–2 párrafos en lenguaje de negocio para stakeholders...",
  "alertas": [
    "Transparencia bajó 14 puntos respecto al ciclo anterior — explorar qué cambió",
    "Brecha de 28 puntos entre PO y Dev Team en Backlog con N suficiente"
  ],
  "generadoEn": "2026-04-15T10:23:00Z"
}
```
Output estimado: ~700–900 tokens
**Costo por análisis: ~$0.01–0.02 USD**

**Almacenamiento y caché:**
El resultado se guarda en `analisis_ia/{teamId}_{ciclo}` en Firestore. Las siguientes veces que el coach abra ese equipo y ciclo, se muestra el resultado cacheado con timestamp. El botón "Analizar con IA" solo aparece activo cuando hay datos nuevos desde el último análisis (Regla 3 de optimización).

**Visualización en el admin:**
Panel "Análisis IA" en la tarjeta del equipo con 5 secciones colapsables:
- Narrativa de coaching
- Foco recomendado para la sesión (dimensiones priorizadas con justificación)
- Síntesis de comentarios por sección
- Agenda de debrief borrador
- Resumen ejecutivo (listo para copiar a email o insertar en PPT)
- Alertas (regresiones, gaps críticos)

**Fallback si la API falla:**
Las recomendaciones estáticas de `RECS` y `RECS_ROLE` siguen funcionando. El panel "Análisis IA" muestra un mensaje de error con opción de reintentar. La herramienta no queda bloqueada.

**Impacto para el coach:**
- La preparación de una sesión de debrief pasa de 1–2 horas a 10 minutos de revisión y ajuste
- La narrativa integra simultáneamente todos los factores que el coach tendría que cruzar manualmente
- El resumen ejecutivo elimina la redacción manual para stakeholders
- La agenda borrador es el punto de partida de la facilitación (#6)

**Implementación sugerida:**
- Instalar `@anthropic-ai/sdk` en `functions/`
- API Key en Firebase Secret Manager: `ANTHROPIC_API_KEY`
- Nueva CF `analyzeTeamWithClaude` en `functions/index.js` (callable, autenticada igual que `createWorkspaceAdmin`)
- Función `buildTeamPrompt(teamId, ciclo)` en `functions/index.js` que agrega los datos de Firestore y los serializa
- Botón "Analizar con IA" en la tarjeta del equipo, deshabilitado si participación < umbral (#2)
- Indicador de caché: timestamp + badge "Datos actualizados" si hay respuestas nuevas

**Complejidad:** Alta
**Dependencias:** #1 (perfil del equipo enriquece el prompt), #2 (valida que haya datos suficientes antes de llamar), #3 (determina qué datos de comentarios incluir según modo de anonimato)

---

## Fase 3 — Experiencia de facilitación

Con el análisis de IA implementado, la Fase 3 tiene más material para trabajar: la agenda generada por #10 alimenta directamente el modo facilitación.

---

### #6. Modo facilitación in-session

**Contexto del cambio respecto al borrador anterior:**
Con la IA integrada, las diapositivas de cada dimensión pueden mostrar preguntas de coaching personalizadas para este equipo específico (generadas por #10) en lugar de las preguntas estáticas de `COACHING_QUESTIONS`. El modo facilitación se convierte en el frontend de lo que la IA ya analizó.

**Problema:**
La guía de facilitación existe como ventana imprimible. Cuando el coach está frente al equipo con pantalla compartida necesita una vista completamente diferente: solo el radar, las preguntas de coaching de la dimensión en curso, sin exponer otros equipos ni datos numéricos crudos al equipo.

**Solución:**
Nueva página `facilitar.html` (acceso autenticado) con dos modos de pantalla simultáneos:

**Pantalla proyectada al equipo:**
- Slide 1: Radar del equipo (solo figura, sin números), nivel de madurez
- Slides 2–7: Una por dimensión — barra de score, 2–3 preguntas de coaching (personalizadas si hay análisis IA, estáticas si no)
- Slide 8: Resumen de acciones creadas en sesión

**Pantalla del coach (ventana principal, no proyectada):**
- Todo lo anterior más: narrativa de la dimensión (del análisis IA), notas privadas editables, botón "Crear acción" prefilled, contexto de brechas por rol

**Control:**
- Navegación con flechas de teclado
- La agenda borrador de #10 preordena las dimensiones sugeridas — el coach puede reordenarlas al inicio

**Impacto para el coach:**
- Usa la herramienta en la sesión en lugar de exportar a PowerPoint
- Las acciones se crean en la herramienta durante la sesión, no en un documento aparte
- Si hay análisis IA, las preguntas de coaching son específicas a la situación del equipo

**Implementación sugerida:**
- `facilitar.html` con parámetro `?teamId=X&ciclo=Y`, autenticado
- Lee `analisis_ia/{teamId}_{ciclo}` para las preguntas personalizadas; fallback a `COACHING_QUESTIONS`
- Estado de slides en `localStorage` (no Firestore — no necesita persistencia)
- Ventana popup para la pantalla proyectada (misma URL con `?modo=proyeccion`)

**Complejidad:** Alta
**Dependencias:** #10 enriquece el contenido pero no es bloqueante — funciona con `COACHING_QUESTIONS` estáticas si no hay análisis IA

---

### #7. Automatización básica de ciclos

**Problema:**
El coach tiene que recordar manualmente cuándo abrir un nuevo ciclo, redistribuir el QR, y volver al panel para ver si llegaron respuestas. Con múltiples equipos y clientes simultáneos, esto genera overhead operativo significativo.

**Solución:**
Tres automatizaciones independientes, implementables en orden:

1. **Recordatorio de apertura de ciclo:** Cadencia configurable (ej: cada 4 semanas). El panel muestra notificación cuando ha pasado ese tiempo: *"Han pasado 5 semanas desde el último assessment del Equipo Phoenix. ¿Abrir nuevo ciclo?"*

2. **Link de respuesta persistente por equipo:** El QR/URL del equipo siempre apunta al ciclo activo. El coach solo abre el ciclo — los participantes usan el mismo link de siempre. Elimina redistribuir el QR cada ciclo.

3. **Resumen semanal vía webhook:** La CF `weeklyDigest` (nueva, reutiliza `dispatchWebhook` ya implementado) envía cada lunes un resumen del estado de todos los equipos: ciclos abiertos, respuestas recibidas, análisis pendientes. El coach lo recibe en Slack o correo.

**Impacto para el coach:**
- Gestionar 5 equipos simultáneos pasa de caótico a sistemático
- El link persistente elimina la fricción operativa más frecuente
- El resumen semanal da visibilidad pasiva — el coach actúa solo cuando hay algo que atender

**Implementación sugerida:**
- `assessmentCadenceWeeks` en `workspaces/{ownerId}`
- `assessment-agile.html?workspaceId=X&equipoId=Y` resuelve el ciclo activo en Firestore (sin parámetro `&ciclo=Z`)
- CF `weeklyDigest` en `functions/index.js`, reutiliza `dispatchWebhook`

**Complejidad:** Media (las tres son independientes — implementar por separado)
**Dependencias:** V2 #18 (webhooks) ya implementado

---

## Fase 4 — Diferenciadores de mercado

Features que colocarían la herramienta por encima de alternativas enterprise. Alta complejidad y requieren volumen de datos o decisiones estratégicas previas.

---

### #8. Benchmark externo cross-workspace anónimo

**Problema:**
El benchmark actual compara un equipo con el promedio de la organización. Si la organización entera está en niveles bajos, el benchmark no ayuda — el equipo "destaca" sobre un promedio malo. El coach no puede decir *"estás en el percentil 60 de equipos Scrum con 1–2 años de adopción"* porque no hay datos externos de referencia.

**Además:** con el análisis de IA activo, el prompt podría incluir percentiles del pool externo como contexto adicional, haciendo la narrativa aún más precisa.

**Solución:**
Pool de datos anonimizados cross-workspace, opt-in. Cada workspace puede contribuir scores agregados (sin identificadores) a una colección compartida.

**Arquitectura:**
- `contributeToPool: true/false` en `workspaces/{ownerId}` (opt-in, por defecto false)
- Al cerrar un ciclo con opt-in activo: CF `contributeToPool` escribe en `pool_agregado` solo scores por dimensión, perfil del equipo, y timestamp trimestral — sin workspace, sin equipo, sin participante
- `pool_stats` con percentiles pre-calculados por perfil de equipo, actualizada periódicamente
- Panel de percentiles en el admin solo para workspaces con opt-in activo

**Vista en el panel:**
```
Tu equipo vs. pool global (N=847 equipos con perfil similar)
  Ceremonias:      72% · Percentil 65  ▲ Por encima del promedio
  Product Backlog: 58% · Percentil 42  → En la media
  Dev Team:        45% · Percentil 28  ▼ Por debajo del promedio
```

**Impacto para el coach:**
- Puede contextualizar el score con referencia externa objetiva
- Conversaciones más ricas con stakeholders: "no estamos mal en abstracto, pero en Dev Team estamos en el percentil 28"
- Con volumen suficiente, el pool se convierte en activo de datos único en el mercado hispanohablante

**Complejidad:** Alta
**Dependencias:** #1 (perfil del equipo para segmentar el pool). Requiere ~50 equipos para que los percentiles sean significativos.

---

### #9. Soporte multi-framework — Kanban como primer paso

**Problema:**
La herramienta se llama "Assessment de Madurez Agile" pero solo mide Scrum. Un equipo Kanban tiene que responder preguntas sobre Sprint Planning y Daily que no aplican. Excluye al 30–40% del mercado que no usa Scrum puro. Diferida en V2 por falta de definición de dimensiones.

**Nota sobre IA:** Con Claude integrado, las preguntas de Kanban podrían tener recomendaciones generadas dinámicamente desde el primer día, sin necesidad de escribir `RECS_KANBAN` hardcodeado. Esto reduce significativamente el esfuerzo de implementación.

**Solución:**
Selector de framework al inicio del formulario. Primer paso: assessment específico para Kanban.

**Dimensiones propuestas para Kanban:**
1. **Flujo de trabajo:** Visualización, límites de WIP, gestión de cuellos de botella
2. **Políticas explícitas:** Definition of Done, criterios de entrada por columna, clases de servicio
3. **Cadencias:** Replenishment meeting, throughput review, retrospectiva de servicio
4. **Métricas de flujo:** Cycle time, throughput, CFD, lead time distribution
5. **Mejora continua:** Kaizen, experimentación, gestión de la deuda
6. **Orientación al cliente:** Reutilizable desde Scrum sin cambios

**Complejidad:** Muy alta — refactoriza el corazón de la herramienta
**Dependencias:** Requiere diseño de preguntas Kanban antes de implementar. Recomendable como proyecto independiente.

---

## Notas de implementación

**Orden recomendado dentro de cada fase:**
- Fase 1: #1 → #2 → #3 (el contexto alimenta la participación, que alimenta el anonimato; los tres son prerequisito para que #10 funcione bien)
- Fase 2: #4 primero (baja complejidad, alto impacto visual) → #10 (requiere #1, #2, #3 completos para máximo valor)
- Fase 3: #7 → #6 (reducir fricción operativa antes de invertir en la experiencia de facilitación; #6 se enriquece si #10 ya está implementado)
- Fase 4: #8 (requiere #1) → #9 (proyecto autónomo)

**Tests:**
- Cada mejora que añada campos a `respuestas` requiere tests en `analysis.test.js`
- La CF `analyzeTeamWithClaude` requiere tests con mock de la API de Anthropic para verificar la construcción del prompt y el manejo del fallback
- Mantener los 94 tests actuales pasando en cada PR

**Deploy:**
CI/CD automático en push a main. Las nuevas Cloud Functions (#10, #7) requieren configurar `ANTHROPIC_API_KEY` en Firebase Secret Manager antes del primer deploy.

**Estimación de costo mensual de IA (referencia):**
| Escenario | Análisis/mes | Costo estimado |
|-----------|-------------|----------------|
| 1 coach, 5 equipos, 1 ciclo/mes | ~5–10 | < $0.20 USD |
| 5 coaches, 25 equipos activos | ~50–100 | ~$1–2 USD |
| 20 coaches, 100 equipos activos | ~200–400 | ~$4–8 USD |
