# Plan de Mejoras V2 — Subir de Nivel

Propuestas para evolucionar la herramienta de **medición** a **acompañamiento de coaching**, cerrando la brecha con las herramientas enterprise del mercado (Agility Health Radar, Comparative Agility) desde el segmento de coaches independientes y consultoras pequeñas.

**20 mejoras organizadas en 4 fases.** Las fases no son estrictamente secuenciales — dentro de cada fase las mejoras son independientes entre sí salvo que se indique dependencia explícita.

---

## Resumen ejecutivo

| Fase | Enfoque | Mejoras | Estado |
|------|---------|---------|--------|
| 1 — Quick wins | Completar lo que ya casi está | #4, #5, #6, #19, #20 | ✅ Completada — 2026-04-10 |
| 2 — Core coaching | Funcionalidades que definen una herramienta de coaching | #1, #3, #7, #9, #10 | Pendiente |
| 3 — Engagement | Involucrar al equipo, no solo al coach | #11, #12, #13, #14, #16 | Pendiente |
| 4 — Plataforma | Features enterprise y diferenciadores de mercado | #2, #8, #15, #17, #18 | Pendiente |

---

## Fase 1 — Quick wins ✅ COMPLETADA

Implementada el 2026-04-10. Las 5 mejoras se implementaron en una sola sesión sin cambios arquitecturales.

| # | Mejora | Commit |
|---|--------|--------|
| #4 | Notas del coach por equipo y ciclo | `1aee758` |
| #6 | Umbral de anonimato por rol (MIN=3) | `36bae12` |
| #19 | Historial de reportes compartidos | `8370eb1` |
| #20 | Contador de respuestas en tiempo real | `412812e` |
| #5 | Briefing pre-assessment personalizable | `86abfc4` |

---

### #4. Notas del coach por equipo y ciclo

**Problema:**
Los datos del assessment quedan sin contexto de interpretación. El coach no tiene dónde registrar que el equipo estaba en modo crunch, que hay un conflicto entre el PO y el Dev Team, o que la baja en Ceremonias se debe a una reestructuración reciente. Sin ese contexto, los números del próximo ciclo no se pueden interpretar correctamente.

**Solución:**
Campo de texto enriquecido (textarea) en la pestaña Análisis, visible por equipo y editable por el coach. Se guarda en Firestore bajo `equipos/{id}/notas/{ciclo}` o como campo `notas` en el documento del equipo. Solo visible en el panel admin, nunca en reportes compartibles.

**Impacto para el coach:**
- Construye una memoria del engagement que no depende de notas externas
- Facilita la preparación de sesiones después de períodos de ausencia
- Si hay cambio de coach, el contexto no se pierde

**Implementación sugerida:**
- Campo `notas` por ciclo en Firestore (objeto `{ [ciclonombre]: string }`)
- Textarea colapsable en la tarjeta de equipo, debajo del detalle por pregunta
- Guardado automático con debounce (sin botón de guardar)

**Complejidad:** Baja
**Dependencias:** Ninguna

---

### #5. Briefing pre-assessment personalizable

**Problema:**
Los participantes reciben el QR y responden en frío, sin contexto. En equipos con bajo nivel de confianza o cultura de evaluación negativa, esto genera respuestas sesgadas hacia arriba o hacia abajo. El encuadre previo es parte del rigor metodológico del assessment.

**Solución:**
El coach configura un mensaje por workspace (o por equipo) que el participante ve en una pantalla intermedia antes de la pantalla de inicio. El mensaje por defecto cubre anonimidad y propósito; el coach puede editarlo. Se guarda en Firestore bajo `usuarios/{uid}/briefing` o en el documento del workspace.

**Ejemplo de mensaje por defecto:**
> *"Este assessment es anónimo. Los resultados se analizan de forma agregada — nadie podrá identificar tu respuesta individual. El objetivo es identificar juntos dónde podemos mejorar como equipo, no evaluar a personas."*

**Impacto para el coach:**
- Reduce el sesgo de respuesta
- Profesionaliza la experiencia del participante
- El coach puede personalizar el encuadre según el contexto del cliente

**Implementación sugerida:**
- Campo `briefingTexto` en el documento del usuario/workspace en Firestore
- Pantalla intermedia en `assessment-agile.html` entre la carga inicial y el intro actual
- Editor simple de texto en la pestaña Equipos del panel admin

**Complejidad:** Baja
**Dependencias:** Ninguna

---

### #6. Umbral mínimo de anonimidad

**Problema:**
En equipos pequeños (2–4 personas), si hay 1 PO y 1 Scrum Master, sus respuestas son identificables aunque no aparezca el nombre. Mostrar los resultados por rol en esos casos rompe la promesa de anonimidad y puede inhibir respuestas honestas en ciclos futuros.

**Solución:**
Definir un umbral mínimo de respuestas por rol (por defecto: 3) por debajo del cual no se desglosa por rol — se muestra solo el agregado con un aviso: *"Se necesitan al menos 3 respuestas por rol para mostrar el desglose. Actualmente hay 1 respuesta de Product Owner."*

**Impacto para el coach:**
- Protege la credibilidad del proceso
- Previene problemas de confianza en el equipo
- El coach puede configurar el umbral según el tamaño típico de sus equipos

**Implementación sugerida:**
- Constante `MIN_RESPONSES_FOR_ROLE_BREAKDOWN = 3` configurable por workspace
- Verificación en `renderAnalysis()` antes de mostrar el desglose por rol
- Mensaje de aviso en lugar del desglose cuando no se cumple el umbral

**Complejidad:** Baja
**Dependencias:** Ninguna

---

### #19. Historial de reportes compartidos

**Problema:**
El coach genera un reporte para stakeholders pero no tiene forma de ver qué reportes generó, cuándo expiran, ni revocarlos desde el panel. Actualmente hay que ir a Firebase Console para gestionarlos.

**Solución:**
Sección en la pestaña Equipos (o dentro de cada tarjeta de equipo en Análisis) que lista los reportes activos del workspace: equipo, ciclo, fecha de generación, fecha de expiración y botón de revocar.

**Impacto para el coach:**
- Control completo sobre lo que está compartido con stakeholders
- Puede revocar links si el cliente cambia o si hay información sensible
- Visibilidad sin depender de Firebase Console

**Implementación sugerida:**
- Query `db.collection('reportes').where('ownerId', '==', uid)` en `fetchAllData()`
- Lista en la pestaña Equipos debajo de la gestión de ciclos
- Botón "Revocar" que elimina el documento de `reportes/{token}`

**Complejidad:** Baja
**Dependencias:** Mejora #5 de V1 (ya implementada — reportes/{token} en Firestore)

---

### #20. Contador de respuestas en tiempo real

**Problema:**
Cuando el coach abre un ciclo y comparte el QR, está ciego hasta que hace clic en "Actualizar". No sabe si han respondido 2 o 20 personas. Esto genera ansiedad operativa y hace que el coach tenga que estar actualizando manualmente.

**Solución:**
En la pestaña Análisis, un indicador por equipo que muestra respuestas recibidas en el ciclo activo vs. el ciclo anterior como referencia. Opcionalmente, un listener en tiempo real de Firestore (`onSnapshot`) que actualice el contador sin necesidad de refrescar.

**Ejemplo:** `Equipo Phoenix · Ciclo Q2 2026 · 4 respuestas (Q1: 7)`

**Impacto para el coach:**
- Sabe cuándo tiene suficiente N para analizar
- Puede hacer seguimiento sin salir del panel
- Reduce el overhead operativo de cada ciclo

**Implementación sugerida:**
- Listener `onSnapshot` en la colección `respuestas` filtrado por equipoId y ciclo activo
- Indicador numérico en el header de cada tarjeta de equipo
- Badge visual cuando el N del ciclo actual es menor que el del ciclo anterior

**Complejidad:** Baja-media
**Dependencias:** Ninguna

---

## Fase 2 — Core coaching

Las funcionalidades que distinguen una herramienta de coaching de una herramienta de medición. Son el corazón de la propuesta de valor diferenciadora.

---

### #1. Detección automática de divergencia entre roles

**Problema:**
El hallazgo más valioso de cualquier sesión de debriefing no es el promedio — es la brecha de percepción entre roles. Que el PO piense que las Ceremonias están en 80% y el Dev Team las vea en 30% es la conversación de coaching. Hoy el coach tiene que calcular esto manualmente comparando pestañas.

**Solución:**
Para cada equipo con respuestas de al menos 2 roles distintos, calcular la diferencia de percepción por dimensión. Si la diferencia supera un umbral (por defecto ≥25 puntos porcentuales), resaltar la dimensión con un badge "Brecha de percepción" y un tooltip: *"Product Owner: 78% · Dev Team: 31% — diferencia de 47 puntos. Conversación de coaching prioritaria."*

**Impacto para el coach:**
- Identifica en segundos el punto de mayor valor para la sesión
- No requiere análisis manual de los datos
- Es el hallazgo que más sorprende a los equipos y genera reflexión genuina

**Implementación sugerida:**
- Función `detectRoleGaps(tid, cycleFilter)` que calcula diferencias entre roles por dimensión
- Badge visible en la tarjeta de equipo en la dimensión afectada (color naranja/rojo según magnitud)
- Sección colapsable "Brechas de percepción detectadas" al inicio de la tarjeta cuando hay ≥1 brecha
- Umbral configurable por el coach (por defecto 25%)

**Complejidad:** Media
**Dependencias:** Ninguna

---

### #3. Guía de debriefing auto-generada

**Problema:**
Preparar la sesión de debriefing con el equipo toma 1–2 horas al coach: revisar los datos, identificar puntos clave, formular preguntas. Para un coach que atiende 5 equipos, eso son 8–10 horas de prep por ciclo.

**Solución:**
Basada en los resultados del ciclo, el sistema genera automáticamente una "guía de facilitación" descargable con:
- Las 3 dimensiones con mayor oportunidad de mejora
- Las brechas de percepción detectadas (de #1)
- 2–3 preguntas de coaching sugeridas por dimensión, con variantes según el nivel
- Puntos de celebración (dimensiones que mejoraron vs. ciclo anterior)

**Ejemplo de pregunta sugerida:**
> *Excelencia Técnica está en 28%. Pregunta sugerida: "¿Qué pasaría si mañana necesitan hacer un despliegue de emergencia? ¿Cuánto tardarían y cuánto confían en que no generaría errores?"*

**Impacto para el coach:**
- Reduce la preparación de 2 horas a 20 minutos
- Asegura que el coach cubra los puntos más importantes
- Los coaches menos experimentados tienen soporte metodológico integrado

**Implementación sugerida:**
- Banco de preguntas de coaching por dimensión y rango de score en `assessment-config.js`
- Función `generateDebriefGuide(tid, cycleFilter)` que selecciona las preguntas relevantes
- Botón "Guía de facilitación" en la tarjeta de equipo que abre o descarga el documento
- Formato: HTML para imprimir o PDF vía `window.print()`

**Complejidad:** Media
**Dependencias:** #1 (para incluir brechas de percepción en la guía)

---

### #7. Tendencia por dimensión — línea de tiempo

**Problema:**
La pestaña Evolución muestra el delta entre ciclos consecutivos, pero no la tendencia a lo largo del tiempo. Un equipo que mejoró de 40% a 55% en Q1, luego bajó a 48% en Q2, y volvió a 52% en Q3 — ¿está mejorando o estancado? El delta ciclo-a-ciclo no lo responde.

**Solución:**
Gráfico de líneas (Chart.js) en la pestaña Evolución que muestra la evolución de cada dimensión a lo largo de todos los ciclos con datos. Cada dimensión es una línea con su color. El eje X son los ciclos en orden cronológico, el Y es el porcentaje (0–100%).

**Impacto para el coach:**
- Visualiza tendencias reales vs. variaciones puntuales
- Identifica dimensiones con mejora sostenida vs. oscilación
- Argumento visual directo para conversaciones con dirección

**Implementación sugerida:**
- Nuevo card en la pestaña Evolución: "Tendencia histórica por dimensión"
- Dataset de Chart.js con una línea por dimensión
- Filtrable por equipo y rol (mismos filtros del tab Evolución existente)
- Solo visible cuando hay ≥3 ciclos con datos

**Complejidad:** Media
**Dependencias:** Ninguna

---

### #9. Índice de momentum de mejora

**Problema:**
Un equipo en 70% que lleva 3 ciclos estancado necesita una intervención diferente a un equipo en 55% que mejoró 15 puntos en 2 ciclos. El nivel absoluto no cuenta la historia completa.

**Solución:**
Calcular una métrica de "momentum": la pendiente promedio de mejora en los últimos N ciclos. Se presenta como un indicador simple junto al score total: ↗ acelerando / → estable / ↘ desacelerando, con el número de puntos de cambio promedio por ciclo.

**Ejemplo:** `Equipo Phoenix · 67% · ↗ +8 pts/ciclo (últimos 3 ciclos)`

**Impacto para el coach:**
- Identifica equipos que necesitan atención aunque su nivel absoluto sea aceptable
- Valida el impacto del coaching de forma más precisa que el nivel absoluto
- Argumento de ROI para el cliente: "en 3 ciclos pasamos de -2 a +8 pts/ciclo"

**Implementación sugerida:**
- Función `calcMomentum(tid, role, n=3)` en `admin-api.js`
- Indicador junto al score total en la tarjeta de equipo (pequeño, no invasivo)
- Solo visible cuando hay ≥2 ciclos con datos

**Complejidad:** Media
**Dependencias:** Ninguna

---

### #10. Análisis de consistencia por pregunta

**Problema:**
Un promedio de 1.5/3 en una pregunta puede significar cosas muy distintas: que todos respondieron 1 o 2 (equipo consistente con brecha real) o que la mitad respondió 0 y la mitad 3 (equipo fracturado en esa práctica). Los histogramas ya muestran esto visualmente, pero no hay una señal automática que diga "esta pregunta está fracturada".

**Solución:**
Para cada pregunta con alta polarización (ej: >40% de respuestas en los extremos 0 y 3 simultáneamente), marcar con un badge "Opiniones divididas" en el histograma. En la guía de debriefing (#3), estas preguntas se priorizan como puntos de conversación.

**Impacto para el coach:**
- Las preguntas polarizadas señalan fracturas de percepción dentro del mismo rol
- Son los puntos de mayor potencial de aprendizaje en una sesión de debriefing
- Complementa la detección de brechas entre roles (#1) con brechas dentro del mismo rol

**Implementación sugerida:**
- Función `isPolarized(counts)` que detecta si ≥X% de respuestas están en 0 y 3 simultáneamente
- Badge visual en el histograma de la pregunta afectada
- Umbral configurable (por defecto: si suma de extremos ≥50%)

**Complejidad:** Baja-media
**Dependencias:** Histogramas por pregunta (ya implementado en V1)

---

## Fase 3 — Engagement del equipo

Involucrar al equipo en el proceso, no solo al coach. La herramienta pasa de ser "del coach" a ser "del equipo y del coach".

---

### #11. Portal de equipo (sin login de admin)

**Problema:**
El equipo responde el assessment y no vuelve a ver nada. El ciclo de feedback está roto: los participantes no saben cómo quedaron sus resultados, no ven el plan de acción que el coach creó con ellos, y no tienen visibilidad sobre si los compromisos se están cumpliendo.

**Solución:**
Link único por equipo (no personal, no con login) que da acceso a una vista de solo lectura con:
- Resultados del último ciclo (radar + barras por dimensión)
- Evolución histórica del equipo
- Plan de acción con estado actual de cada ítem
- Sin datos de otros equipos, sin controles de admin

Diferente del reporte para stakeholders (que es un snapshot estático) — este es dinámico y vive mientras el workspace existe.

**Impacto para el coach:**
- Cierra el ciclo de feedback con el equipo
- Aumenta el engagement del equipo con el proceso
- El equipo puede ver su progreso sin depender del coach para cada consulta

**Implementación sugerida:**
- Nueva colección `portales/{teamId}` con token de acceso permanente (regenerable)
- Nueva página `equipo.html?t=TOKEN` con vista dinámica (lee de Firestore en tiempo real)
- Botón "Link del equipo" en la pestaña Equipos del admin
- Reglas Firestore: lectura pública por token, sin escritura

**Complejidad:** Alta
**Dependencias:** #12 (si se quiere que el equipo pueda actualizar estados)

---

### #12. Estados del plan de acción actualizables por el equipo

**Problema:**
El coach es el único que puede actualizar el estado de las acciones. En engagements donde el coach no está presente semana a semana, el plan de acción queda desactualizado hasta la próxima sesión.

**Solución:**
En el portal de equipo (#11), los responsables de cada acción pueden marcar el estado (Pendiente → En curso → Completado). El cambio se refleja inmediatamente en el panel del coach. El coach mantiene control total (puede revertir cambios, editar, eliminar).

**Impacto para el coach:**
- El plan de acción vive entre sesiones, no solo durante ellas
- El coach llega a la sesión con información actualizada sin tener que pedirla
- Genera accountability natural entre los miembros del equipo

**Implementación sugerida:**
- Reglas Firestore: allow update en `planes/{id}` si el token del portal coincide con el equipoId del plan
- Botón de cambio de estado en cada ítem del portal de equipo
- Indicador de "actualizado por equipo" en el panel del coach

**Complejidad:** Media
**Dependencias:** #11 (Portal de equipo)

---

### #13. Recordatorios de apertura de ciclo

**Problema:**
Cada vez que el coach abre un nuevo ciclo, tiene que salir de la plataforma, ir a email/Slack, pegar el link y pedirle al equipo que responda. Con 5–10 equipos activos, este overhead se acumula.

**Solución:**
Al activar un ciclo en la pestaña Equipos, el coach puede escribir una lista de emails de los miembros del equipo. Al abrir el ciclo, se envía automáticamente un email con el link del assessment (con workspaceId y teamId pre-configurados).

**Impacto para el coach:**
- Elimina el paso manual de notificación
- El equipo recibe el link correcto directamente (no la URL raíz)
- Reduce el tiempo de respuesta: el equipo recibe el aviso inmediatamente

**Implementación sugerida:**
- Campo `emails` (array) en el documento del equipo en Firestore
- Cloud Function `notifyTeamOnCycleOpen` que se dispara al activar un ciclo
- Integración con SendGrid (ya identificada como pendiente técnico)
- Editor de lista de emails en la pestaña Equipos

**Complejidad:** Media
**Dependencias:** SendGrid o dominio verificado (pendiente técnico existente)

---

### #14. Preguntas personalizables por workspace

**Problema:**
Después de 4–5 ciclos, el equipo conoce las preguntas de memoria y las responde sin reflexión genuina. Además, algunos clientes tienen contextos muy específicos (equipos de hardware, equipos de datos, etc.) donde algunas preguntas del assessment estándar no aplican o necesitan matices.

**Solución:**
El coach puede en su workspace:
1. Desactivar preguntas que no aplican al contexto del cliente
2. Agregar hasta 3 preguntas propias por sección (con sus 4 opciones de respuesta)
3. Ajustar el texto de una pregunta existente sin cambiar la lógica de scoring

Las preguntas custom no se incluyen en el scoring total para mantener la comparabilidad entre workspaces. Se muestran al final de cada sección como "preguntas adicionales" y sus respuestas se guardan en `comments` o en un campo separado.

**Impacto para el coach:**
- El assessment puede evolucionar junto con el engagement
- Clientes con contextos específicos tienen una herramienta adaptada
- Reduce el efecto "piloto automático" en ciclos avanzados

**Implementación sugerida:**
- Colección `configuraciones/{ownerId}` con preguntas custom y preguntas desactivadas
- Editor de preguntas en el panel admin (nueva pestaña "Configuración")
- `assessment-agile.html` lee la configuración del workspace antes de renderizar
- Las preguntas custom se marcan claramente para que el participante las distinga

**Complejidad:** Alta
**Dependencias:** Ninguna (pero impacta `assessment-config.js` y `assessment-agile.html`)

---

### #16. Marca del coach (white-label básico)

**Problema:**
Cuando el coach comparte el formulario o el reporte con el cliente, aparece "Assessment Agile" genérico. Para coaches que quieren proyectar su propia marca o la marca de su consultora, esto es una brecha de percepción profesional.

**Solución:**
El coach configura en su workspace:
- Nombre de la marca (aparece en el header del formulario y del reporte)
- URL del logo (imagen que reemplaza el título)
- Color de acento principal (reemplaza el azul por defecto)

Estos valores se leen del workspace al cargar el formulario y el reporte compartible.

**Impacto para el coach:**
- La herramienta se presenta como "de su consultora", no como una plataforma genérica
- Aumenta la percepción de valor del coach ante el cliente
- Diferenciador para coaches que atienden múltiples clientes corporativos

**Implementación sugerida:**
- Campos `marca`, `logoUrl`, `colorAcento` en el documento del usuario en Firestore
- `assessment-agile.html` y `reporte.html` leen estos valores e inyectan CSS variables
- Editor de marca en la pestaña Configuración del panel admin

**Complejidad:** Media
**Dependencias:** Ninguna

---

## Fase 4 — Plataforma y diferenciadores de mercado

Features de mayor complejidad que posicionan la herramienta como alternativa real a las soluciones enterprise.

---

### #2. Modo facilitación / presentación en sala

**Problema:**
El coach necesita proyectar los resultados durante la sesión de debriefing con el equipo. Hoy sus opciones son: mostrar el panel admin (con todos los controles visibles), el PDF (estático, sin interacción) o el reporte para stakeholders (pensado para otro contexto).

**Solución:**
Vista de presentación en pantalla completa accesible desde el panel admin con un botón "Modo presentación". Muestra:
- Nombre del equipo y ciclo en grande
- Radar hexagonal a pantalla completa
- Navegación por dimensión con click o teclas de flecha
- Al hacer click en una dimensión: desglose por rol, histograma de respuestas y brecha de percepción (de #1)
- Modo oscuro por defecto (proyector)
- Sin ningún control de admin visible

**Impacto para el coach:**
- Elimina la necesidad de preparar slides externos
- La sesión de debriefing puede ser completamente interactiva con los datos reales
- Es el feature más visual y diferenciador frente a competidores

**Implementación sugerida:**
- Nueva vista `renderPresentation(tid, cycleFilter)` en `admin-render.js`
- Botón "Presentar" en la tarjeta de equipo que abre ventana nueva en fullscreen
- Navegación por teclado (flechas, Esc para salir)
- Lógica de slides: intro → radar → dim 1 → dim 2 → ... → plan de acción

**Complejidad:** Alta
**Dependencias:** #1 (divergencia de roles — se integra en la presentación)

---

### #8. Benchmarking interno y externo

**Problema:**
"¿Estamos bien o mal?" es la pregunta que hace cualquier cliente cuando ve el 58% en Excelencia Técnica. Sin un punto de referencia externo, el número es relativo y pierde impacto.

**Solución:**
**Fase 8a — Benchmarking interno:**
Comparar cada equipo contra el promedio de todos los equipos del workspace del coach. Disponible de inmediato una vez que hay ≥3 equipos con datos.

**Fase 8b — Benchmarking global (opt-in):**
Los workspaces que opten por contribuir sus datos (anónimos, sin identificador de empresa) forman una base de referencia global. Cada equipo ve su percentil: *"Tu equipo está en el percentil 68 en Excelencia Técnica entre equipos con perfil similar."*

**Impacto para el coach:**
- El número cobra sentido contextual inmediato
- Argumento de venta para el cliente: "puedo decirte no solo dónde estás, sino dónde estás vs. el mercado"
- Solo tiene valor real con volumen — implementar 8b cuando haya ≥50 workspaces contribuyendo

**Implementación sugerida:**
- 8a: función `computeWorkspaceBenchmark()` con datos existentes
- 8b: colección `benchmark_global` con agregados anónimos por dimensión y rango de equipo
- Cloud Function que actualiza el benchmark global semanalmente (opt-in por workspace)
- Indicador de percentil en la tarjeta de equipo (pequeño, no dominante)

**Complejidad:** Media (8a) / Alta (8b)
**Dependencias:** Volumen de datos real para 8b

---

### #15. Variantes del assessment

**Problema:**
La herramienta está diseñada específicamente para Scrum. Muchos equipos usan Kanban, Scrumban o marcos de escalado (LeSS, Nexus). Para esos equipos, las preguntas sobre Sprint Planning o Sprint Goal no aplican, y el coaching se distorsiona.

**Solución:**
Variantes configurables del assessment con dimensiones y preguntas adaptadas:
- **Kanban:** Flujo, WIP, Cadencia de entrega, Feedback loops, Mejora continua
- **Scrumban / híbrido:** Subset combinado de Scrum + Kanban
- El coach selecciona la variante al crear el equipo

La arquitectura ya lo permite: `assessment-config.js` es la fuente única de verdad y se puede parametrizar por variante.

**Impacto para el coach:**
- Amplía el mercado al que puede ofrecer la herramienta
- El análisis es más preciso para equipos que no son puramente Scrum
- No requiere construir una herramienta nueva — es configuración

**Implementación sugerida:**
- Nuevo archivo `assessment-config-kanban.js` con las dimensiones y preguntas de Kanban
- Campo `variant` en el documento del equipo ('scrum' | 'kanban' | 'scrumban')
- `assessment-agile.html` carga la configuración correcta según la variante del equipo
- El panel admin usa la config correcta para mostrar dimensiones y recomendaciones

**Complejidad:** Alta
**Dependencias:** #14 (base de preguntas customizables — comparten infraestructura)

---

### #17. Exportación a presentación (PowerPoint / Google Slides)

**Problema:**
Aunque la herramienta genera PDFs, muchos coaches y clientes necesitan una presentación editable para compartir internamente, agregar contexto o presentar a dirección. Preparar esa presentación manualmente desde los datos del panel toma 2–3 horas.

**Solución:**
Botón "Exportar presentación" en la pestaña Análisis que genera un archivo `.pptx` con las diapositivas clave:
1. Portada (equipo + ciclo + fecha)
2. Resumen ejecutivo (score total, nivel, N respuestas)
3. Radar por equipo
4. Resultados por dimensión
5. Madurez por rol (si hay múltiples roles)
6. Top 3 oportunidades de mejora (recomendaciones)
7. Plan de acción con estado actual
8. Evolución histórica (si hay ≥2 ciclos)

**Impacto para el coach:**
- Elimina 2–3 horas de trabajo manual por cliente por ciclo
- Presentación consistente y de calidad sin esfuerzo de diseño
- El coach puede personalizar la presentación generada antes de entregarla

**Implementación sugerida:**
- Librería `PptxGenJS` (JavaScript, sin dependencias de servidor)
- Función `exportPPTX(tid, cycleFilter)` en `admin-export.js`
- Las gráficas se exportan como imágenes (canvas.toDataURL()) e insertan en slides
- Las diapositivas siguen el mismo estilo visual de la herramienta (colores, tipografía)

**Complejidad:** Alta
**Dependencias:** Ninguna (PptxGenJS es client-side)

---

### #18. Webhooks e integraciones básicas

**Problema:**
La herramienta vive aislada del ecosistema de herramientas del cliente. Las acciones del plan no llegan a Jira. Las notificaciones no llegan a Slack. Los resultados no se sincronizan con Notion. Cada integración requiere copia manual.

**Solución:**
Sistema de webhooks configurables por workspace: al ocurrir un evento (ciclo cerrado, reporte generado, acción completada), se dispara un POST a una URL configurada por el coach con el payload del evento.

**Eventos iniciales:**
- `cycle.opened` — ciclo activado, incluye link del assessment
- `cycle.closed` — ciclo desactivado, incluye resumen de resultados
- `report.generated` — reporte compartible creado, incluye URL
- `plan.status_changed` — acción de plan actualizada

Con webhooks, el coach puede conectar a través de Zapier / Make con cualquier herramienta (Slack, Jira, Notion, email, Airtable, etc.) sin que la herramienta necesite integraciones nativas.

**Impacto para el coach:**
- Un webhook a Slack puede notificar automáticamente al equipo cuando se abre el ciclo
- Un webhook a Jira puede crear tickets desde el plan de acción
- Arquitectura de integración que escala sin necesidad de construir cada integración

**Implementación sugerida:**
- Campo `webhookUrl` y `webhookSecret` en el workspace del coach
- Cloud Function que dispara el webhook en cada evento relevante
- Log de últimas 10 ejecuciones del webhook (éxito / error) visible en el panel
- Interfaz de configuración en la pestaña Configuración

**Complejidad:** Alta
**Dependencias:** Cloud Functions (ya existente)

---

## Roadmap sugerido

```
Q2 2026 — Fase 1: Quick wins
  ├── #6  Umbral de anonimidad
  ├── #20 Contador en tiempo real
  ├── #19 Historial de reportes
  ├── #5  Briefing pre-assessment
  └── #4  Notas del coach

Q3 2026 — Fase 2: Core coaching
  ├── #10 Análisis de consistencia por pregunta
  ├── #9  Índice de momentum
  ├── #1  Detección de divergencia entre roles
  ├── #7  Tendencia histórica por dimensión
  └── #3  Guía de debriefing auto-generada

Q4 2026 — Fase 3: Engagement del equipo
  ├── #16 White-label básico
  ├── #13 Recordatorios de ciclo (si SendGrid disponible)
  ├── #11 Portal de equipo
  ├── #12 Estados actualizables por equipo
  └── #14 Preguntas personalizables

Q1 2027 — Fase 4: Plataforma
  ├── #8a Benchmarking interno
  ├── #17 Exportación a presentación
  ├── #2  Modo facilitación en sala
  ├── #18 Webhooks e integraciones
  └── #15 Variante Kanban
```

---

## Tabla resumen

| # | Mejora | Fase | Complejidad | Dependencias | Estado |
|---|--------|------|-------------|--------------|--------|
| 4 | Notas del coach | 1 | Baja | — | Pendiente |
| 5 | Briefing pre-assessment | 1 | Baja | — | Pendiente |
| 6 | Umbral de anonimidad | 1 | Baja | — | Pendiente |
| 19 | Historial de reportes compartidos | 1 | Baja | V1 #5 ✅ | Pendiente |
| 20 | Contador en tiempo real | 1 | Baja-media | — | Pendiente |
| 1 | Divergencia entre roles | 2 | Media | — | Pendiente |
| 3 | Guía de debriefing | 2 | Media | #1 | Pendiente |
| 7 | Tendencia histórica | 2 | Media | — | Pendiente |
| 9 | Índice de momentum | 2 | Media | — | Pendiente |
| 10 | Consistencia por pregunta | 2 | Baja-media | V1 histogramas ✅ | Pendiente |
| 11 | Portal de equipo | 3 | Alta | — | Pendiente |
| 12 | Estados por equipo | 3 | Media | #11 | Pendiente |
| 13 | Recordatorios de ciclo | 3 | Media | SendGrid | Pendiente |
| 14 | Preguntas personalizables | 3 | Alta | — | Pendiente |
| 16 | White-label básico | 3 | Media | — | Pendiente |
| 2 | Modo facilitación | 4 | Alta | #1 | Pendiente |
| 8 | Benchmarking | 4 | Media-alta | Volumen datos | Pendiente |
| 15 | Variante Kanban | 4 | Alta | #14 | Pendiente |
| 17 | Exportación a presentación | 4 | Alta | — | Pendiente |
| 18 | Webhooks e integraciones | 4 | Alta | Cloud Functions ✅ | Pendiente |
