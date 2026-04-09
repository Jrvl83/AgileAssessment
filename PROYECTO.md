# Assessment de Madurez Agile

Herramienta web para evaluar el nivel de madurez de equipos Scrum. Permite a los equipos autoevaluarse en 4 dimensiones clave, obtener un nivel de madurez y recibir recomendaciones personalizadas según su rol.

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | HTML / CSS / JavaScript (Vanilla SPA) |
| Base de datos | Firebase Firestore |
| Hosting | Firebase Hosting |
| Idioma | Español |

**Proyecto Firebase:** `agile-assessment-5a117`

---

## Arquitectura de archivos

```
AssessmentAgile/
├── assessment-agile.html   # Formulario público del assessment
├── admin.html              # Panel de administración (protegido)
├── firebase.json           # Configuración de hosting y rewrites
└── .firebaserc             # Proyecto Firebase activo
```

### Routing (firebase.json)

| Ruta | Archivo |
|------|---------|
| `/` y cualquier ruta | `assessment-agile.html` |
| `/admin` | `admin.html` |

---

## Flujo de usuario

### Participante (sin login)

```
Pantalla de inicio
  → Seleccionar equipo (activo en Firestore)
  → Ingresar nombre (opcional)
  → Seleccionar rol: Product Owner / Dev Team / Scrum Master / Otro
    ↓
4 secciones del assessment (una por dimensión)
  → 3–4 preguntas por sección
  → 4 opciones de respuesta por pregunta (radio buttons)
  → Navegación con botones Anterior / Siguiente
    ↓
Pantalla de resultados
  → Puntaje total y nivel de madurez
  → Resultados guardados en Firebase
```

### Administrador (contraseña: `AgileAdmin`)

Acceso en `/admin`. Panel con 4 pestañas:

| Pestaña | Función |
|---------|---------|
| **Análisis** | Estadísticas agregadas, madurez por equipo y rol, recomendaciones, exportación PDF/CSV |
| **Evolución** | Progreso de equipos a lo largo de ciclos de medición |
| **Equipos** | Alta, baja y activación de equipos |
| **Ciclos** | Creación y activación de ciclos de medición |

---

## Metodología del Assessment

### Dimensiones evaluadas

El assessment mide madurez en 4 dimensiones de Scrum:

| # | Dimensión | Enfoque | Rol | Preguntas | Puntaje Máx. |
|---|-----------|---------|-----|-----------|--------------|
| 1 | **Eventos** | Calidad y valor de las ceremonias Scrum | PO + Dev Team | 4 | 12 pts |
| 2 | **Backlog** | Gestión del Product Backlog por el PO | Product Owner | 3 | 9 pts |
| 3 | **Dev Team** | Autoorganización y entrega técnica | Dev Team | 4 | 12 pts |
| 4 | **Transparencia** | Inspección, adaptación y pilares empíricos | PO + Dev Team | 3 | 9 pts |

**Total:** 14 preguntas — puntaje máximo: **42 puntos**

---

### Sistema de puntuación

Cada pregunta tiene 4 opciones ordenadas de menor a mayor madurez:

| Opción | Puntos | Descripción |
|--------|--------|-------------|
| 1 | 0 | Práctica ausente o inconsistente |
| 2 | 1 | Práctica inicial con brechas importantes |
| 3 | 2 | Práctica parcialmente establecida |
| 4 | 3 | Práctica consolidada y generando valor |

**Cálculo del puntaje:**

```
% Dimensión  = (suma de puntos de dimensión / máximo de dimensión) × 100
% Total      = (suma total de puntos / 42) × 100
```

---

### Niveles de madurez

| Nivel | Rango | Etiqueta | Descripción |
|-------|-------|----------|-------------|
| 1 | 0 – 40% | **Inicial** | El equipo conoce la teoría Scrum pero la práctica es inconsistente. Alta dependencia externa. |
| 2 | 41 – 65% | **En desarrollo** | Adopción parcial de Scrum. Los eventos ocurren pero la generación de valor no está optimizada. |
| 3 | 66 – 82% | **Maduro** | Scrum bien integrado. El equipo entrega valor consistentemente con mejora continua. |
| 4 | 83 – 100% | **Avanzado** | Equipo ágil de alto rendimiento. El empirismo guía las decisiones; la mejora es parte del ADN. |

---

### Preguntas del assessment

#### Sección 1 — Ceremonias y Ritmo del Equipo (Eventos)

**P1. Sprint Planning y Sprint Goal**
- Nunca o raramente se planifica → A veces, con objetivo vago → Casi siempre con objetivo definido → Siempre guiando las decisiones del Sprint

**P2. Daily Scrum enfocado en el Sprint Goal**
- No hay Daily o es un reporte de estado → Daily sin foco en el Goal → Mayormente enfocado en el Goal → Herramienta real de adaptación diaria

**P3. Sprint Review con stakeholders y retroalimentación**
- No hay Review o es solo interna → Hay stakeholders pero sin incorporación de feedback → Feedback útil a veces → Siempre influye en el Product Backlog

**P4. Retrospectiva con mejoras concretas e implementadas**
- No hay Retro → Retro sin compromisos → Se definen mejoras, pocas se implementan → Seguimiento sistemático e implementación consistente

---

#### Sección 2 — Gestión del Product Backlog (Backlog)

**P5. Ordenamiento del backlog por valor**
- No ordenado o criterio poco claro → Ordenado por esfuerzo o cronología → Parcialmente por valor → Por valor, revisado continuamente

**P6. Criterios de aceptación antes del Sprint**
- Raramente tienen criterios → Algunos criterios básicos → La mayoría tiene criterios → Todos con criterios claros y verificables

**P7. Product Goal definido y conocido por el equipo**
- No hay Goal formal → Existe pero el equipo no lo conoce → Se conoce pero no guía → Guía el refinamiento y la priorización

---

#### Sección 3 — Autoorganización y Entrega (Dev Team)

**P8. Autoorganización sin asignación externa de tareas**
- Un líder asigna todas las tareas → Cierta autoorganización con dependencia → Mayormente autoorganizado → Autonomía plena en cada Sprint

**P9. Cumplimiento de la Definition of Done**
- No hay DoD → Existe pero rara vez se cumple → Se cumple en la mayoría de casos → Siempre; cada Incremento es utilizable

**P10. Habilidades cross-funcionales y dependencia externa**
- Muchas dependencias externas → Dependencias frecuentes en algunas áreas → Mayormente autónomo → Totalmente cross-funcional

**P11. Gestión del WIP para evitar cuellos de botella**
- Sin límites de WIP; crecimiento descontrolado → Crece sin control → Cierta conciencia sin límites formales → Límites activos de WIP en práctica

---

#### Sección 4 — Transparencia, Inspección y Adaptación (Transparencia)

**P12. Visibilidad del progreso e impedimentos**
- Información fragmentada o desactualizada → Visibilidad parcial en algunas áreas → Buena visibilidad con brechas menores → Transparencia total en tiempo real

**P13. Adaptación del plan basada en el aprendizaje del Sprint**
- El plan no cambia → Adaptaciones mínimas → Adaptaciones frecuentes basadas en evidencia → Inspección y adaptación continua

**P14. Valores Scrum visibles en las interacciones diarias**
- Rara vez se manifiestan → Algunos valores presentes de forma inconsistente → La mayoría se practica regularmente → Los valores son parte de la cultura del equipo

---

### Recomendaciones por rol

Las recomendaciones se generan automáticamente según el **puntaje de cada dimensión** y el **rol del participante**. Hay 3 rangos de recomendación por dimensión:

| Rango | Etiqueta |
|-------|----------|
| 0 – 33% | Básico |
| 34 – 66% | Intermedio |
| 67 – 100% | Avanzado |

#### Product Owner

| Dimensión | 0–33% | 34–66% | 67–100% |
|-----------|-------|--------|---------|
| Eventos | Definir Sprint Goal claro; enfocar Reviews en valor de negocio | Conectar Sprint Goal con Product Goal; inspeccionar backlog tras feedback | Asegurar que las Reviews sean sesiones reales de inspección/adaptación con métricas |
| Backlog | Definir Product Goal inspirador; implementar User Stories con criterios de aceptación | Implementar refinamiento regular con el equipo; evaluar WSJF/Kano para priorización | Conectar ítems con Product Goal; explorar Impact Mapping u OKRs |
| Dev Team | Estar disponible durante el Sprint para clarificaciones rápidas | Revisar detalle y claridad de User Stories; eliminar dependencias externas | Participar en la DoD para asegurar criterios de calidad de negocio |
| Transparencia | Hacer el Product Backlog visible; definir métricas simples de progreso | Compartir activamente el Product Goal; conectar Sprint Backlog con objetivos de negocio | Rastrear métricas de outcome (impacto de negocio), no solo output (features) |

#### Dev Team

| Dimensión | 0–33% | 34–66% | 67–100% |
|-----------|-------|--------|---------|
| Eventos | Apropiarse del Daily; enfocarse en el Sprint Goal; co-crear el Sprint Plan | Generar compromisos concretos en Retro con responsable; Sprint Reviews como conversaciones reales | Generar mejoras sistémicas en Retros; evaluar técnicas avanzadas |
| Backlog | Exigir sesiones de refinamiento regulares; hacer preguntas técnicas; identificar riesgos | Participar activamente; rechazar Stories sin criterios de aceptación claros | Conectar Stories con el "por qué" de negocio; tomar mejores decisiones técnicas |
| Dev Team | Definir DoD que todos validen; distribuir el conocimiento | Rotar tareas; implementar pair programming; mapear y eliminar dependencias externas | Implementar límites de WIP; medir cycle time; mejorar el flujo |
| Transparencia | Mantener el Scrum Board actualizado en tiempo real | Escalar impedimentos temprano en el Daily antes de que bloqueen | Incorporar métricas de flujo (burndown, velocity, cycle time) |

#### Scrum Master

| Dimensión | 0–33% | 34–66% | 67–100% |
|-----------|-------|--------|---------|
| Eventos | Facilitar formación sobre el propósito de cada evento; asegurar compromiso con el Sprint Goal | Mejorar calidad de facilitación; usar técnicas para eventos autónomos del equipo | Enfocarse en la autonomía del equipo para facilitar sus propios eventos |
| Backlog | Facilitar colaboración PO-equipo; organizar sesiones de refinamiento | Observar sesiones; identificar malentendidos; educar en escritura de User Stories | Conectar backlog con métricas de valor; explorar priorización avanzada |
| Dev Team | Crear espacios seguros para tomar decisiones; comenzar con autoselección de tareas | Mapear dependencias externas; trabajar en eliminación de impedimentos | Enfocarse en métricas de velocidad y predictibilidad |
| Transparencia | Establecer Scrum Board visible; formar al equipo sobre su importancia | Trabajar en visibilidad y seguimiento de impedimentos | Crear dashboard de métricas de flujo para conversaciones basadas en datos |

---

## Base de datos (Firestore)

### Colecciones

#### `equipos`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `nombre` | string | Nombre del equipo |
| `activo` | boolean | Si el equipo está disponible en el formulario |

#### `ciclos`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `nombre` | string | Nombre del ciclo (ej: "Q1 2025") |
| `activo` | boolean | Ciclo actualmente activo |

#### `respuestas`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `equipoId` | string | ID del documento del equipo |
| `equipoNombre` | string | Nombre del equipo (desnormalizado) |
| `participante` | string | Nombre del participante ("Anónimo" si no completó) |
| `rol` | string | Rol: Product Owner / Dev Team / Scrum Master / Otro |
| `ciclo` | string | Nombre del ciclo activo al momento del envío |
| `scoreEventos` | number | Puntaje bruto de la dimensión Eventos |
| `scoreBacklog` | number | Puntaje bruto de la dimensión Backlog |
| `scoreDevTeam` | number | Puntaje bruto de la dimensión Dev Team |
| `scoreTransparencia` | number | Puntaje bruto de la dimensión Transparencia |
| `scoreTotalPct` | number | Porcentaje total (0–100) |
| `nivel` | string | Etiqueta del nivel de madurez |
| `fecha` | timestamp | Timestamp del servidor al momento del envío |

---

## Exportación de datos

Desde el panel admin se puede exportar:

| Formato | Contenido |
|---------|-----------|
| **PDF** | Reporte de análisis completo (impresión optimizada) |
| **CSV resumen** | Promedio por equipo y dimensión |
| **CSV detalle** | Todas las respuestas individuales con metadatos |

---

## Mejoras implementadas

| Prioridad | Mejora | Descripción |
|-----------|--------|-------------|
| Alta | `assessment-config.js` | Fuente única de verdad para preguntas, niveles, dimensiones y recomendaciones. Ambos HTML lo cargan dinámicamente. |
| Alta | Dispersión / alineación del equipo | Cada tarjeta de equipo muestra badge "Alineación Alta/Media/Baja" y rango min–max por dimensión cuando hay 2+ respuestas. |
| Alta | Plan de Acción | Nueva pestaña en admin con acciones de mejora por equipo: iniciativa, responsable, fecha, estado y ciclo. Colección Firestore `planes`. |
| Media | Nuevas dimensiones | 2 dimensiones nuevas: **Excelencia Técnica** (CI/CD, tests, deuda técnica) y **Orientación al Cliente** (contacto con usuarios, métricas de valor). 14 → **20 preguntas**, 4 → **6 dimensiones**. |
| Media | Contexto del equipo | Campos opcionales en el intro: tamaño del equipo (1–5 / 6–9 / 10+) y tiempo usando Scrum (<6 / 6–18 / >18 meses). Se guardan en Firestore y en CSV. |
| Media | QR code por equipo | Botón QR en cada equipo del admin genera un modal con QR + URL copiable. La URL incluye `?teamId=` para pre-seleccionar el equipo en el formulario. |
| Baja | Prevención de duplicados | Aviso informativo si el participante ya respondió en el ciclo activo (detección vía localStorage, sin bloquear). |
| Baja | Evolución por pregunta | Las respuestas individuales se guardan en Firestore. En la pestaña Evolución aparece un detalle por pregunta mostrando % del último ciclo y delta respecto al anterior. |

---

## Historial de versiones (commits clave)

| Commit | Descripción |
|--------|-------------|
| `afe26c9` | Fix: fetch ciclo activo en el momento del submit |
| `1f0c8d4` | Feat: migración a Firebase + ciclos de medición + exportación + filtros por rol |
| `d0ae33e` | Feat: recomendaciones por nivel de madurez por dimensión |
| `697d75e` | Fix: mostrar hasta 3 recomendaciones por equipo |
| `b648e2d` | Feat: dashboard de análisis en panel admin |
| `6d56865` | Feat: integración Airtable + panel admin (versión anterior) |
| `2d0d339` | Initial commit |
