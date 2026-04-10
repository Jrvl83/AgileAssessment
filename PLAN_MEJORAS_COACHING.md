# Plan de Mejoras — Perspectiva Coach Agile

Mejoras identificadas desde la perspectiva de un coach agile que usa la herramienta con clientes reales. Organizadas por impacto en el trabajo de coaching.

---

## Prioridad Alta

---

### 1. Gráfico de radar (spider chart) por equipo ✅ Completado — commit `90b6b29`

**Problema:**
Las 6 dimensiones se muestran como barras de progreso. En una sesión de presentación con el equipo o con stakeholders, el coach tiene que hacer el trabajo mental de integrar los 6 números en una imagen. No hay una visualización que muestre la "forma" del equipo de un vistazo.

**Solución implementada:**
Gráfico de radar hexagonal en cada tarjeta de equipo de la pestaña Análisis. Chart.js 4.4.3 vía CDN. Los 6 puntos del radar usan el color de cada dimensión. Tooltip con % al hacer hover. Se inicializa con `requestAnimationFrame` tras cada render y destruye instancias previas para evitar fugas de memoria. No aparece en exportación PDF (`no-print`).

**Impacto para el coach:**
- El radar es el visual estándar de toda evaluación de madurez ágil.
- En presentaciones con el cliente, es el primer slide. Sin él el coach lo tiene que construir manualmente en PowerPoint.
- Permite ver de un vistazo si el equipo es equilibrado o asimétrico (ej: fuerte en Ceremonias, débil en Excelencia Técnica).

---

### 2. Distribución de respuestas por pregunta ✅ Completado — commit `d0bd0cd`

**Problema:**
El panel muestra promedios por dimensión. Un promedio de 1.5/3 puede significar que todos respondieron entre 1 y 2 (equipo consistente) o que la mitad respondió 0 y la otra mitad 3 (equipo fracturado). Son situaciones completamente distintas que requieren intervenciones distintas, pero el promedio las hace ver idénticas.

**Solución implementada:**
Sección colapsable "Detalle por pregunta" en cada tarjeta de equipo. Muestra un mini histograma de 4 barras (una por valor 0-3) para cada pregunta, agrupadas por dimensión. Los datos se leen de `r.fields.Answers` en Firestore. El histograma visualiza la dispersión real de respuestas. Implementado en `renderQuestionDetail()` en `admin-render.js`.

**Impacto para el coach:**
- Es el dato más útil para preparar el debriefing con el equipo.
- Permite identificar preguntas con alta dispersión que señalan fracturas de percepción.
- Complementa el badge de alineación con granularidad a nivel de pregunta.

---

### 3. Vinculación Plan de Acción ↔ Evolución ✅ Completado — commit `d0bd0cd`

**Problema:**
El Plan de Acción y la pestaña Evolución viven separados. El coach no puede mostrarle al cliente la conexión entre una acción concreta tomada en Q1 y la mejora observada en Q2. Esa conexión causal es lo que justifica la continuidad del engagement y demuestra el valor del proceso.

**Solución implementada:**
- Campo opcional "Dimensión" en el formulario de Plan de Acción (dropdown con las 6 dimensiones).
- Badge de dimensión coloreado en cada ítem del listado de planes.
- En la pestaña Evolución, sección "Planes vinculados" que filtra planes por equipo y dimensión seleccionada, agrupados por dimensión, con chip de delta y badge de estado de cada acción.
- Los botones "+ Plan" en Análisis pre-rellenan automáticamente la dimensión correspondiente.

**Impacto para el coach:**
- Convierte la herramienta de un sistema de medición a un sistema de mejora continua verificable.
- Facilita la narrativa "hicimos X → pasó Y" que los clientes necesitan para comprometerse con el siguiente ciclo.

---

## Prioridad Media

---

### 4. Preguntas abiertas al final de cada sección ✅ Completado — commit `1c7c6c6`

**Problema:**
Todo el assessment es cuantitativo. El número dice *qué* está mal; el texto libre dice *por qué*. El coach hoy tiene que ir a buscar el "por qué" en conversaciones separadas, perdiendo el momento en que el participante tiene el contexto fresco.

**Solución implementada:**
Textarea opcional al final de cada una de las 6 secciones del formulario público con el texto: *"¿Qué está bloqueando más a tu equipo en esta área? (opcional)"*. No bloquea la navegación ni el envío. Los comentarios se guardan en Firestore bajo el campo `comments` por sección. En el panel admin, la sección colapsable "Detalle por pregunta" muestra las citas anónimas agrupadas por dimensión con borde del color correspondiente. El toggle del detalle muestra el conteo de comentarios cuando hay al menos uno.

**Impacto para el coach:**
- Da contexto cualitativo que enriquece enormemente el análisis.
- Permite preparar preguntas específicas para la sesión de debriefing.
- Los participantes suelen escribir lo que no dirían en voz alta — es información muy honesta.

---

### 5. Link de solo lectura para stakeholders ✅ Completado — commit `5a5d325`

**Problema:**
Para mostrarle los resultados a un director, gerente de producto u otro stakeholder, el coach tiene que darle acceso al panel (con todas las funciones de admin) o exportar el PDF. No hay un punto intermedio: una vista limpia y de solo lectura de los resultados de un ciclo específico, sin login ni controles.

**Solución implementada:**
- Botón "↗ Compartir reporte" en cada tarjeta de equipo (pestaña Análisis), respeta el filtro de ciclo activo.
- `generateReport()` en `admin-api.js`: computa snapshot con stats, dims, radar, madurez por rol y recomendaciones ya procesadas; guarda en `reportes/{auto-id}` con expiración a 30 días.
- Modal con URL lista para copiar (reutiliza `qr-modal`).
- `reporte.html`: página pública independiente — lee el token de `?t=TOKEN`, verifica expiración, renderiza radar (Chart.js), barras por dimensión, madurez por rol y recomendaciones. Sin login, sin controles de edición.
- `firestore.rules`: lectura pública de `reportes/{token}`, creación autenticada, eliminación solo por owner o super_admin.

**Impacto para el coach:**
- Permite compartir resultados con stakeholders de forma profesional y sin fricción.
- El coach mantiene el control: puede generar o revocar el link.
- Ideal para enviar por email antes de una reunión ejecutiva.

---

### 6. Comparativa visual entre equipos del mismo workspace ✅ Completado — commit `871c0e1`

**Problema:**
Si el workspace tiene varios equipos, no hay una vista que los compare lado a lado. El coach tiene que ir tarjeta por tarjeta y hacer la comparación mentalmente. En presentaciones ejecutivas esto es un gap importante.

**Solución implementada:**
Nuevo card "Comparativa por dimensión" en la pestaña Análisis, visible cuando hay ≥2 equipos con datos. Incluye:
- Radar superpuesto con un dataset por equipo en colores distintos (paleta de 8 colores), con leyenda debajo.
- Tabla heatmap: filas = equipos, columnas = 6 dimensiones + total. Celdas con semáforo de color (verde ≥80%, ámbar ≥60%, rojo <60%).
- Respeta los filtros de ciclo y rol activos.

**Impacto para el coach:**
- Esencial cuando trabaja con múltiples equipos en la misma organización.
- Permite identificar qué equipo necesita más atención en qué dimensión.
- Facilita conversaciones con la dirección sobre el estado general de la organización.

---

### 7. Exportación del Plan de Acción ✅ Completado — commit `1f1aec6`

**Problema:**
El botón de exportación PDF solo incluye el análisis de resultados, no el Plan de Acción. El coach necesita entregar al cliente un documento con los compromisos concretos, responsables y fechas — no solo los números.

**Solución implementada:**
Botón "↓ Exportar Plan PDF" en la pestaña Plan de Acción (visible solo cuando hay acciones). Genera un documento HTML independiente en ventana nueva y dispara `window.print()`. Incluye: resumen de conteos por estado, tabla de acciones agrupadas en orden En curso → Pendiente → Completado, con columnas Iniciativa, Responsable, Fecha objetivo y Ciclo. Respeta los filtros activos de equipo y ciclo. Implementado en `admin-export.js` con función `exportPlanPDF()`.

---

## Prioridad Baja

---

### 8. Benchmark externo (referencia de industria)

**Problema:**
Cuando el coach presenta un 58% en Excelencia Técnica, el cliente pregunta inevitablemente "¿eso es bueno o malo?". Sin un punto de referencia externo, el número flota en el vacío y pierde parte de su impacto.

**Solución:**
Agregar percentiles o rangos de referencia calculados sobre todos los equipos anónimos que han usado la herramienta (opt-in). Mostrar en el panel: *"Tu equipo está en el percentil 65 de equipos con perfil similar."*

**Consideraciones:**
- Requiere acumular suficiente volumen de datos para que sea estadísticamente válido.
- Los equipos deben optar explícitamente por contribuir sus datos al benchmark (opt-in en la configuración del workspace).
- Filtrable por industria o tamaño de equipo si hay suficientes datos.
- **Implementar solo cuando haya volumen real de datos** — un benchmark con pocos datos es peor que no tener benchmark.

---

### 9. Notificación al equipo al abrir un ciclo

**Problema:**
Cuando el coach abre un nuevo ciclo, tiene que salir de la plataforma, ir a Slack/Teams/email, pegar el link y pedirle al equipo que responda. Es fricción operativa que se repite en cada ciclo.

**Solución:**
En la pestaña Equipos, al activar un nuevo ciclo, ofrecer la opción de enviar un email de notificación a una lista de direcciones configuradas por equipo. El email incluiría el link del formulario con el workspaceId preconfigurado.

**Consideraciones:**
- Depende de resolver primero el problema de entregabilidad de emails (SendGrid o dominio verificado). Ver pendiente en `PLAN_ARQUITECTURA.md`.
- Las direcciones de email se guardan en el documento del equipo en Firestore.

---

### 10. Manejo diferenciado del rol "Otro"

**Problema:**
Las respuestas de participantes con rol "Otro" se mezclan en el promedio general sin distinción. Este rol no corresponde a ninguno de los tres roles Scrum, por lo que puede introducir ruido en el análisis — especialmente si hay stakeholders externos, managers o personas que participan esporádicamente.

**Solución:**
- En la pestaña Análisis, agregar "Otro" como opción explícita en el filtro de rol (hoy ya existe el filtro, verificar si "Otro" aparece).
- Opción de excluir "Otro" del promedio principal con un toggle visible.
- En las estadísticas mostrar entre paréntesis el N de cada rol para que el coach sepa cuánto pesa cada grupo.

---

## Resumen

| # | Mejora | Prioridad | Complejidad | Estado |
|---|--------|-----------|-------------|--------|
| 1 | Gráfico de radar por equipo | Alta | Media | ✅ Completado |
| 2 | Distribución de respuestas por pregunta | Alta | Media | ✅ Completado |
| 3 | Vinculación Plan de Acción ↔ Evolución | Alta | Alta | ✅ Completado |
| 4 | Preguntas abiertas por sección | Media | Media | ✅ Completado |
| 5 | Link de solo lectura para stakeholders | Media | Alta | ✅ Completado |
| 6 | Comparativa visual entre equipos | Media | Media | ✅ Completado |
| 7 | Exportación del Plan de Acción en PDF | Media | Baja | ✅ Completado |
| 8 | Benchmark externo | Baja | Muy alta | Descartado — requiere volumen |
| 9 | Notificación al equipo al abrir ciclo | Baja | Media | Descartado — requiere SendGrid |
| 10 | Manejo diferenciado del rol "Otro" | Baja | Baja | ✅ Completado |
