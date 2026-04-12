# Plan de Mejoras V3 — Herramienta de coaching profesional

Propuestas para elevar la herramienta de **acompañamiento de coaching** a **instrumento de diagnóstico metodológicamente sólido**, cerrando los gaps identificados desde la perspectiva de un Agile coach que la usa con clientes corporativos reales.

**10 mejoras organizadas en 4 fases.** La IA (Claude API) es un componente dado de la Fase 2 en adelante y redefine cómo se implementan varias de estas mejoras.

---

## Resumen ejecutivo

| Fase | Enfoque | Mejoras | Prioridad |
|------|---------|---------|-----------|
| 1 — Credibilidad del dato | Los tres gaps que un cliente corporativo cuestionaría primero | #1, #2, #3 | ✅ Completada 2026-04-12 |
| 2 — Análisis con IA | Síntesis narrativa que reemplaza la preparación manual del coach | #4, #10 | ✅ Completada 2026-04-12 |
| 3 — Experiencia de facilitación | Integrar la herramienta en la sesión, no solo en la preparación | #6, #7 | ✅ Completada 2026-04-12 |
| 4 — Flujo operacional, calidad del dato y visión ejecutiva | Outputs tangibles, integridad del dato, cierre formal | #8, #9, #11, #12, #13, #14 | ✅ Completada 2026-04-12 |

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

## Fase 3 — Experiencia de facilitación ✅ Completada 2026-04-12

Con el análisis de IA implementado, la Fase 3 integra la herramienta directamente en la sesión de debrief con el equipo.

---

### #6. Modo facilitación in-session ✅ `f7c953a`

**Solución implementada:**
Nueva página `facilitar.html` (acceso autenticado) con slides navegables por teclado para guiar la sesión de retroalimentación con el equipo.

**Estructura de slides:**
- **Portada:** nombre del equipo, ciclo, score global + nivel de madurez, mini grid con % por dimensión
- **[Narrativa IA]:** slide opcional con `analisis_ia.narrativa` si hay análisis disponible
- **6 slides de dimensión:** título de la sección, score + nivel, 3 preguntas de coaching del nivel exacto del equipo (de `COACHING_QUESTIONS`)
- **[Foco IA]:** slide opcional con `analisis_ia.focusSesion` si hay análisis disponible
- **Cierre:** pregunta de compromisos del equipo

**Panel de notas del coach (toggle `N` o botón):**
- Preguntas de coaching completas para la dimensión actual
- Alertas de IA para la dimensión (si hay análisis)
- Tips de facilitación por tipo de slide
- Para el cierre: `focusSesion`, `agendaSesion` y `sintesisComentarios` del análisis IA

**Control:**
- `←/→` o `PageUp/PageDown` para navegar entre slides
- `N` para mostrar/ocultar el panel de notas del coach
- Botón "Facilitar →" en pestaña Equipos del admin (abre nueva pestaña con `?workspaceId=X&equipoId=Y`)
- Si hay ciclo filtrado activo en el admin, se pasa como `&ciclo=Z`
- Rewrite `/facilitar` en `firebase.json`

**Fallback:** funciona sin análisis IA usando únicamente `COACHING_QUESTIONS` estáticas.

---

### #7. Automatización básica de ciclos ✅ (partes 1 y 2 implementadas)

**Parte 1 — Link persistente por equipo ✅ `42b11b0`**
URL canónica del QR renombrada de `?teamId=X` a `?equipoId=X` (consistente con Firestore).
`assessment-agile.html` lee `equipoId` con fallback a `teamId` para QRs anteriores.
El ciclo se resuelve dinámicamente desde Firestore — el mismo link funciona en cualquier ciclo.

**Parte 2 — Recordatorio de apertura de ciclo ✅ `bdaca2b`**
Campo `assessmentCadenceWeeks` en `workspaces/{uid}`. Banner ámbar visible entre el tab bar y el contenido cuando han pasado ≥ N semanas sin nuevas respuestas. Descartable por sesión con botón ✕. Sección "Cadencia de ciclos" en pestaña Configuración con select de 1–8 semanas (o Desactivado).

**Parte 3 — Resumen semanal vía webhook: descartada**
El recordatorio en panel (Parte 2) ya cubre el caso de uso principal con menor complejidad. Un digest semanal requiere Firebase Scheduler y aporta poco valor diferencial sobre lo que ya existe.

---

## Fase 4 — Flujo operacional, calidad del dato y visión ejecutiva ✅ Completada 2026-04-12

Seis mejoras ordenadas por impacto/esfuerzo.

| Orden | Feature | Impacto | Esfuerzo | Estado |
|-------|---------|---------|---------|--------|
| 1 | **#11** Acciones desde facilitar.html | Cierra el loop más importante del flujo | Bajo | ✅ `2e28f6f` |
| 2 | **#12** Contexto adicional para análisis IA | Mejora calidad narrativa notablemente | Bajo | ✅ `53c0dab` |
| 3 | **#13** Detección de respuestas rápidas | Protege integridad del dato | Bajo | ✅ `628db46` |
| 4 | **#9** Export sesión de facilitación | Output tangible de cada sesión | Bajo | ✅ `a601164` |
| 5 | **#14** Cierre formal del ciclo | Elimina overhead operativo masivo | Medio | ✅ `bb4f87b` |
| 6 | **#8** Tendencia org por ciclo | Visibilidad ejecutiva longitudinal | Medio | ✅ `ab81706` |

---

### #11. Crear acciones desde facilitar.html ✅ `2e28f6f`

**Problema:**
Es el gap más crítico del flujo actual. El coach guía la sesión, el equipo genera compromisos en el slide de cierre — y esos compromisos desaparecen. El coach termina la sesión, cierra la pestaña de `facilitar.html`, y tiene que ir al panel admin a reconstruir de memoria lo que se acordó. En la práctica, muchas acciones simplemente no se capturan.

**Solución:**
Formulario de creación rápida de acciones directamente en el slide de cierre de `facilitar.html`. Las acciones se guardan en la colección `planes` de Firestore con los mismos campos que el Plan de Acción del admin.

**Diseño del formulario (en el slide de cierre):**
```
[+ Nueva acción]
Iniciativa: ________________________
Responsable: ____________  Fecha: _______
Dimensión: [select]   Estado: Pendiente
[Guardar acción]

Acciones creadas esta sesión:
✓ "Definir Sprint Goal con el equipo el próximo lunes" — Dev Team — 2026-04-20
✓ "Revisar DoD en la próxima Retro" — Dev Team — 2026-04-27
```

**Implementación:**
- Función `createActionFromFacilitator(data)` en `facilitar.html` — escribe en `planes/{id}` con `equipoId`, `ciclo`, `ownerId` del URL param `workspaceId`
- Lista inline de acciones creadas en sesión (solo en memoria, desaparece al cerrar pestaña)
- `ownerId` = `workspaceId` del URL — no requiere lookup adicional
- El campo dimensión usa el mismo `select` de DIMS que el admin

**Complejidad:** Baja
**Dependencias:** `facilitar.html` ya tiene Firebase init. Solo añade un formulario y una escritura Firestore.

---

### #12. Contexto adicional para el análisis IA ✅ `53c0dab`

**Problema:**
El prompt a Claude recibe scores, brechas, momentum y comentarios — pero no sabe nada del contexto organizacional que explica esos datos. Un equipo con transparencia en caída puede estar en una reestructuración corporativa, haber cambiado de Scrum Master, o estar bajo presión de un deadline externo. Sin ese contexto, la narrativa IA es correcta pero genérica.

**Solución:**
Campo de texto opcional "Contexto para el análisis" que el coach completa antes de hacer clic en "Analizar con IA". Se incluye al inicio del prompt, antes de los datos estructurados.

**Diseño:**
```
Contexto para el análisis (opcional)
┌─────────────────────────────────────────────────┐
│ Ej: "El equipo acaba de incorporar 2 personas   │
│ nuevas. El SM lleva solo 6 semanas en el rol.   │
│ Hay presión de dirección por un release en mayo."│
└─────────────────────────────────────────────────┘
[Analizar con IA →]
```

**Dónde:**
- Textarea en el panel "Análisis con IA" de la tarjeta del equipo, visible solo cuando `aiEnabled = true`
- Se persiste en `analisis_ia/{teamId}_{ciclo}` como campo `contextoCoach` junto al resultado
- Se muestra en el panel de resultados junto al timestamp ("Analizado con contexto del coach")

**En el prompt:**
```
CONTEXTO DEL COACH:
{contextoCoach}

A continuación, los datos del equipo...
```

**Complejidad:** Baja
**Dependencias:** CF `analyzeTeamWithClaude` ya implementada — solo añade un parámetro al callable y una línea al prompt.

---

### #12b. Subida de imágenes (gráficos) para análisis con IA ✅ `086b41f`

**Problema:**
mammoth.js no puede extraer los gráficos binarios DrawingML incrustados en un DOCX. El coach puede tener capturas de pantalla de gráficos externos (Jira, burndown, velocity) que son relevantes para el análisis pero que no pueden incluirse vía documento.

**Solución:**
Subida directa de imágenes PNG/JPG. El coach toma screenshots y las adjunta en el panel IA. Claude las analiza con su API de visión nativa e integra el hallazgo en la narrativa.

**Límites:**
- Máx. 3 imágenes por análisis
- Máx. 2 MB por imagen
- Las imágenes no se almacenan — solo se usan en el prompt de la llamada

**Implementación:**
- `handleImageUpload(key, input)` — lee archivos con `FileReader`, convierte a base64, valida tamaño, guarda en `state.aiImages[key]`
- `removeImage(key, index)` — elimina imagen y re-renderiza
- UI en el panel IA: sección "Imágenes (gráficos)" debajo del DOCX, botón "Añadir imagen", miniaturas con nombre y botón ✕ individual
- `callAnalyzeTeamWithClaude` pasa `{ data, mediaType }[]` a la CF (sin nombre ni size)
- CF: cuando hay imágenes, construye `content` como array mixto — bloques `image` + bloque `text` con instrucción y prompt principal. Sin imágenes: string plano (comportamiento previo)

**Complejidad:** Baja-media
**Dependencias:** CF `analyzeTeamWithClaude` ya implementada

---

### #13. Detección de respuestas rápidas ✅ `628db46`

**Problema:**
En culturas corporativas con presión de cumplimiento, algunos participantes completan el assessment en 60–90 segundos marcando opciones al azar sin leer las preguntas. El coach no tiene forma de detectarlo. Esas respuestas sesgan los promedios y generan narrativas IA incorrectas.

**Solución:**
Registrar el tiempo de inicio y el tiempo de envío. Si el total es menor a un umbral razonable, marcar la respuesta como "posiblemente apresurada" — sin bloquear el envío ni identificar al participante.

**Umbral:** 3 minutos (180 segundos) para 20 preguntas + campos de contexto = 9 segundos por pregunta mínimo. Es conservador — no penaliza a lectores rápidos.

**Implementación:**
- Timestamp `startedAt` al entrar a la primera sección (en memoria, no Firestore)
- Al enviar: si `elapsed < 180s`, guardar `completionSeconds` y `flaggedFast: true` en `respuestas`
- En el panel admin: badge ⚡ discreto en la lista de respuestas del ciclo con tooltip "Completada en menos de 3 minutos"
- No afecta el scoring ni el análisis IA — solo es información para el coach

**Lo que NO hace:**
- No bloquea el envío
- No muestra el badge al participante
- No excluye la respuesta automáticamente
- El coach decide si incluirla o no en su lectura

**Complejidad:** Baja
**Dependencias:** Ninguna

---

### #9. Resumen exportable de la sesión de facilitación ✅ `a601164`

**Problema:**
Después de usar `facilitar.html`, el coach no tiene un output tangible del trabajo realizado. Sin una referencia física o digital del contenido de la sesión, la continuidad entre sesiones depende de la memoria.

**Solución:**
Botón "↓ Exportar sesión" en la barra de controles de `facilitar.html`, visible solo en modo coach. Genera una ventana imprimible con el contenido de la sesión.

**Contenido del export:**
- Header: nombre del equipo, ciclo, fecha
- Score global + tabla de scores por dimensión con nivel de cada una
- Por cada dimensión: título, score y las 3 preguntas de coaching usadas
- Si hay análisis IA: foco recomendado y agenda sugerida
- Sección "Compromisos acordados" con las acciones creadas en sesión (de #11, si existen) o espacio en blanco para anotar
- Footer discreto: "Generado con Assessment Agile"

**Implementación:**
- Función `printFacilitationSummary()` en `facilitar.html`
- `window.open()` con HTML construido inline + `window.print()`
- CSS `@media print`: tipografía limpia en negro sobre blanco, sin fondos de color, página A4

**Complejidad:** Baja
**Dependencias:** `facilitar.html` ya implementado. Si #11 está implementado, incluye las acciones en el export.

---

### #14. Cierre formal del ciclo ✅ `bb4f87b`

**Problema:**
Cerrar un ciclo hoy es desactivar el toggle en la pestaña Equipos. No ocurre nada más: no se bloquean nuevas respuestas, no se genera un resumen, no se notifica al equipo, no se dispara el webhook `ciclo.cerrado` con los datos finales. El coach tiene que hacer todo eso manualmente en pasos separados — o simplemente no lo hace.

Con 5+ equipos activos y ciclos cada 4 semanas, este overhead es el principal motivo por el que el flujo de trabajo se vuelve caótico.

**Solución:**
Botón "Cerrar ciclo" en la pestaña Equipos (o en el header del ciclo activo en Análisis) que ejecuta en secuencia:

1. **Bloquea nuevas respuestas** para ese ciclo — `activo: false` en el documento del ciclo
2. **Sincroniza el portal** de cada equipo del workspace con los datos finales del ciclo
3. **Dispara webhook** `ciclo.cerrado` con: nombre del ciclo, número de equipos, número de respuestas, scores promedio por dimensión
4. **Muestra resumen** en un modal: equipos evaluados, total de respuestas, score org promedio, % cambio vs. ciclo anterior

**Modal de confirmación (antes de cerrar):**
```
Cerrar ciclo "Q2 2026"
──────────────────────────────
Equipos con respuestas:  4 de 5
Respuestas totales:      23
Score org promedio:      67% (Maduro)
Cambio vs. Q1 2026:      ↗ +4pts

⚠ Equipo Beta — 0 respuestas este ciclo

[Cerrar ciclo igualmente]   [Cancelar]
```

**Nuevo ciclo:**
Después del cierre, ofrecer "Abrir siguiente ciclo" con nombre sugerido (detección de patrón: Q2 → Q3, Sprint 5 → Sprint 6).

**Implementación:**
- Función `closeCycle(cycleId)` en `admin-api.js`
- Llama a `syncPortalData()` para todos los equipos (ya implementado)
- Dispara CF `dispatchWebhook` con evento `ciclo.cerrado` (CF ya implementada)
- Modal de confirmación en `admin-render.js`
- Sugerencia de nombre del siguiente ciclo con regex de patrones comunes (Q1→Q2, Sprint N→Sprint N+1)

**Complejidad:** Media
**Dependencias:** `syncPortalData()`, `dispatchWebhook` — ambas ya implementadas. Solo orquesta lo que existe.

---

### #8. Tendencia de madurez org por ciclo ✅ `ab81706`

**Problema:**
El benchmark interno compara equipos dentro del mismo ciclo (heatmap + radar). Lo que falta es la dimensión temporal de la **organización completa**: ¿está mejorando la org en conjunto ciclo a ciclo? Sin esto, el coach no puede mostrar a dirección una curva de progreso sin calcularlo manualmente en Excel.

**Solución:**
Card "Tendencia org" en la pestaña Análisis, visible cuando hay ≥2 ciclos con datos de ≥2 equipos activos.

**Contenido:**
- Gráfico de líneas (Chart.js) con el score promedio de todos los equipos activos por ciclo
- Una línea por dimensión con `DIM_COLORS`
- Badge org ↗/→/↘ calculado igual que `calcMomentum` por equipo
- Delta en puntos entre primer y último ciclo disponible
- Tooltip en cada punto: "Q2 2026 · 4 equipos · 23 respuestas"

**Vista:**
```
Tendencia org — últimos 4 ciclos
  Ceremonias:    ↗ +12pts  (58% → 70%)
  Dev Team:      → +2pts   (61% → 63%)
  Exc. Técnica:  ↘ –5pts   (55% → 50%)
  ...
```

**Implementación:**
- `calcOrgTrend(cycleNames)` en `admin-api.js` — agrupa `state.responses` por ciclo, promedia todos los equipos
- Card en `renderAnalysis()` debajo del heatmap comparativo, visible solo con ≥2 ciclos
- Nueva instancia `<canvas>` con `window._orgTrendData` (mismo patrón que `_evolTrendData`)
- Sin llamadas Firestore adicionales — todo está en `state.responses`

**Complejidad:** Media
**Dependencias:** Ninguna nueva

---

## Notas de implementación

**Orden recomendado dentro de cada fase:**
- Fase 1: #1 → #2 → #3 (el contexto alimenta la participación, que alimenta el anonimato; los tres son prerequisito para que #10 funcione bien)
- Fase 2: #4 primero (baja complejidad, alto impacto visual) → #10 (requiere #1, #2, #3 completos para máximo valor)
- Fase 3: #7 → #6 (reducir fricción operativa antes de invertir en la experiencia de facilitación; #6 se enriquece si #10 ya está implementado)
- Fase 4: #9 primero (baja complejidad, cierra el loop de `facilitar.html`) → #8 (usa datos ya cargados, añade una sola card)

**Features descartadas y razón:**
- **Benchmark externo cross-workspace (#8 original):** Requiere volumen de datos de múltiples organizaciones para ser estadísticamente útil. Sin ese volumen, los percentiles serían engañosos. Las herramientas como AgilityHealth tardaron años en construir ese pool. Revisitar cuando haya ≥50 organizaciones activas.
- **Multi-framework Kanban (#9 original):** Cada framework (Kanban, SAFe, LeSS) requiere un modelo de medición propio con preguntas validadas por expertos del framework. No es una adición de features — es reconstruir la herramienta 2–3 veces. Revisitar como proyecto independiente.
- **Resumen semanal vía webhook (#7 parte 3):** El recordatorio en panel (cadencia configurable) cubre el caso de uso principal. Firebase Scheduler añade complejidad operativa con bajo valor diferencial.

**Tests:**
- Cada mejora que añada campos a `respuestas` requiere tests en `analysis.test.js`
- La CF `analyzeTeamWithClaude` requiere tests con mock de la API de Anthropic para verificar la construcción del prompt y el manejo del fallback
- Mantener los 94 tests actuales pasando en cada PR

**Deploy:**
CI/CD automático en push a main. Las Cloud Functions requieren `ANTHROPIC_API_KEY` en Firebase Secret Manager.

**Estimación de costo mensual de IA (referencia):**
| Escenario | Análisis/mes | Costo estimado |
|-----------|-------------|----------------|
| 1 coach, 5 equipos, 1 ciclo/mes | ~5–10 | < $0.20 USD |
| 5 coaches, 25 equipos activos | ~50–100 | ~$1–2 USD |
| 20 coaches, 100 equipos activos | ~200–400 | ~$4–8 USD |
