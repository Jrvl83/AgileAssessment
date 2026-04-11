# Assessment de Madurez Agile

Herramienta web para evaluar el nivel de madurez de equipos Scrum. Permite a los equipos autoevaluarse en 4 dimensiones clave, obtener un nivel de madurez y recibir recomendaciones personalizadas según su rol.

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | HTML / CSS / JavaScript (Vanilla SPA) |
| Base de datos | Firebase Firestore |
| Auth | Firebase Authentication (email + contraseña) |
| Backend | Firebase Cloud Functions (Node.js 20) |
| Hosting | Firebase Hosting |
| Idioma | Español |

**Proyecto Firebase:** `agile-assessment-5a117` — Plan **Blaze**

---

## Arquitectura de archivos

```
AssessmentAgile/
├── assessment-agile.html   # Formulario público del assessment (requiere ?workspaceId en URL)
├── admin.html              # Panel de administración — solo HTML + script tags (34 líneas)
├── reporte.html            # Reporte de solo lectura para stakeholders (acceso por token, sin login)
├── assessment-config.js    # Fuente única de verdad: preguntas, niveles, dimensiones, recomendaciones
├── assets/
│   ├── admin.css           # Todos los estilos del panel admin
│   ├── admin-state.js      # Firebase init + variables de estado globales
│   ├── admin-api.js        # Funciones Firestore + helpers de cálculo, estadísticas y generateReport
│   ├── admin-render.js     # Todas las funciones render*, toast, prefillPlan, QR, showReportLink
│   ├── admin-export.js     # exportCSV, exportPDF, exportRaw, exportPlanPDF
│   └── admin-auth.js       # login, logout, onAuthStateChanged
├── firebase.json           # Configuración de hosting, firestore y functions
├── firestore.rules         # Reglas de seguridad de Firestore (versionadas)
├── package.json            # devDependencies: vitest, eslint, firebase-tools
├── vitest.config.js        # Configuración de tests
├── .eslintrc.json          # ESLint: eslint:recommended, browser env, sintaxis JS
├── .gitignore              # Ignora node_modules/, .firebase/, *.docx
├── .github/
│   └── workflows/
│       └── deploy.yml      # CI/CD: lint+tests en PRs, deploy en main
├── tests/
│   ├── setup.js            # Globals: DIMS, COACHING_QUESTIONS, MIN_ROLE_RESPONSES, getLevel, state, render stubs
│   ├── scoring.test.js     # Tests: getLevel, getRec, detectPatterns, getContextNote (25 tests)
│   ├── analysis.test.js    # Tests: calcDispersion, isPolarized, detectRoleGaps, getMajorityRole, getTeamFilteredStats, computeStats, generateDebriefGuide (50 tests)
│   └── evolution.test.js   # Tests: getEvolutionData, calcMomentum (17 tests)
├── functions/
│   ├── index.js            # Cloud Functions: createWorkspaceAdmin, deleteWorkspaceAdmin
│   └── package.json        # Dependencias: firebase-admin, firebase-functions
└── .firebaserc             # Proyecto Firebase activo
PLAN_MEJORAS_COACHING.md    # 10 mejoras fase 1: 8 completadas, 2 descartadas
PLAN_MEJORAS_V2.md          # 20 nuevas mejoras en 4 fases — roadmap Q2 2026 – Q1 2027
```

### Routing (firebase.json)

| Ruta | Archivo | Acceso |
|------|---------|--------|
| `/` y cualquier ruta | `assessment-agile.html` | Requiere `?workspaceId=X` — sin él muestra error |
| `/admin` | `admin.html` | Requiere login (Firebase Auth) |
| `/reporte.html?t=TOKEN` | `reporte.html` | Público, sin login — token con expiración de 30 días |

---

## Flujo de usuario

### Participante (sin login)

```
[Si el coach configuró briefing]
Pantalla de briefing — encuadre de anonimidad y propósito
  → Botón "Entendido, comenzar →"
    ↓
Pantalla de inicio
  → Seleccionar equipo (activo en Firestore)
  → Ingresar nombre (opcional)
  → Seleccionar rol: Product Owner / Dev Team / Scrum Master / Otro
    ↓
6 secciones del assessment (una por dimensión)
  → 3–4 preguntas por sección
  → 4 opciones de respuesta por pregunta (radio buttons)
  → Comentario abierto opcional por sección
  → Navegación con botones Anterior / Siguiente
    ↓
Pantalla de resultados
  → Puntaje total y nivel de madurez
  → Resultados guardados en Firebase
```

### Administrador (Firebase Auth — email + contraseña)

Acceso en `/admin`. Sistema multi-tenant con dos roles:

#### Roles

| Rol | Acceso |
|-----|--------|
| **super_admin** | Ve todos los workspaces, gestiona usuarios (crear / suspender / reactivar / eliminar) |
| **admin** (workspace admin) | Ve solo sus propios equipos, respuestas, ciclos y planes |

#### Pestañas del panel

| Pestaña | Disponible para | Función |
|---------|----------------|---------|
| **Análisis** | Todos | Estadísticas agregadas, madurez por equipo y rol (con umbral de anonimato MIN=3 resp. por rol), toggle "Excluir Otro", badge de alineación, radar por equipo, comparativa multi-equipo, recomendaciones colapsables, histogramas por pregunta con badge "Opiniones divididas" (preguntas polarizadas), notas del coach por ciclo (guardado automático), contador de respuestas en tiempo real con comparación vs. ciclo anterior, indicador de momentum ↗/→/↘ por equipo, sección colapsable "⚡ Brechas de percepción detectadas" por dimensión, botón "Guía de facilitación" (ventana imprimible con top 3 oportunidades + preguntas de coaching + celebraciones), botón "↗ Compartir reporte", exportación PDF/CSV |
| **Evolución** | Todos | Progreso de equipos a lo largo de ciclos, tabla de dimensiones por ciclo, gráfico de líneas de tendencia histórica por dimensión (Chart.js, visible con ≥3 ciclos), detalle por pregunta con delta vs. ciclo anterior, sección "Planes vinculados" por dimensión |
| **Equipos** | Todos | Alta, baja y activación de equipos; botón QR por equipo; editor de marca del workspace (nombre, logo, color de acento — guardado en `workspaces/{uid}`); briefing pre-assessment editable; historial de reportes compartidos con fecha de expiración y botón Revocar |
| **Plan de Acción** | Todos | Acciones de mejora: iniciativa, responsable, fecha, estado, ciclo y dimensión objetivo. Badge de dimensión. Exportación a PDF agrupado por estado |
| **Usuarios** | Solo super_admin | Crear workspace admins, suspender / reactivar / eliminar cuentas, reenviar invitación |

#### Flujo para dar acceso a un cliente

```
1. Super admin entra al panel → pestaña "Usuarios"
2. Ingresa nombre + email del cliente → "Crear usuario y enviar invitación"
3. Cloud Function crea la cuenta en Firebase Auth + documento en Firestore
4. Firebase envía al cliente un correo con link para definir su contraseña
5. Cliente abre el link, define su contraseña y entra a /admin
6. Ve su panel vacío, crea sus equipos y comienza a usar la herramienta
```

---

## Metodología del Assessment

### Dimensiones evaluadas

El assessment mide madurez en 6 dimensiones:

| # | Dimensión | Enfoque | Perspectiva principal | Preguntas | Puntaje Máx. |
|---|-----------|---------|----------------------|-----------|--------------|
| 1 | **Ceremonias** | Calidad y valor de los eventos Scrum | PO + Dev Team | 4 | 12 pts |
| 2 | **Product Backlog** | Gestión del Product Backlog por el PO | Product Owner | 3 | 9 pts |
| 3 | **Dev Team** | Autoorganización y entrega técnica | Dev Team | 4 | 12 pts |
| 4 | **Transparencia** | Inspección, adaptación y pilares empíricos | PO + Dev Team | 3 | 9 pts |
| 5 | **Excelencia Técnica** | CI/CD, pruebas automatizadas, deuda técnica | Dev Team | 3 | 9 pts |
| 6 | **Orientación al Cliente** | Contacto con usuarios, métricas de valor | PO + Dev Team | 3 | 9 pts |

**Total:** 20 preguntas — puntaje máximo: **60 puntos**

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
% Total      = (suma total de puntos / 60) × 100
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

#### Sección 1 de 6 — Ceremonias y ritmo del equipo

**P1. ¿Con qué frecuencia se realiza la Sprint Planning y genera un Sprint Goal claro?**
- Nunca o rara vez → A veces, pero el Goal es vago → Casi siempre con Goal definido → Siempre; el Goal guía cada decisión del Sprint

**P2. ¿El Daily Scrum se usa para inspeccionar el progreso hacia el Sprint Goal y adaptar el plan?**
- No hacemos Daily o es un reporte de estado → Hacemos Daily pero sin foco en el Goal → Mayormente nos enfocamos en el Goal → El Daily es una herramienta real de adaptación diaria

**P3. ¿La Sprint Review involucra a stakeholders reales y genera feedback accionable?**
- No hacemos Review o es solo interna → Hay stakeholders pero el feedback no se incorpora → A veces logramos feedback útil → Siempre; los stakeholders influyen el Product Backlog

**P4. ¿La Retrospectiva produce mejoras concretas que se implementan en el siguiente Sprint?**
- No hacemos Retro → Hacemos Retro pero sin compromisos concretos → Definimos mejoras pero pocas se implementan → Las mejoras se rastrean y se implementan sistemáticamente

---

#### Sección 2 de 6 — Gestión del Product Backlog

**P5. ¿El Product Backlog está ordenado por valor y refleja las necesidades reales de los usuarios?**
- No está ordenado o no existe claro → Está ordenado por esfuerzo o cronología → Ordenado parcialmente por valor → Ordenado por valor, revisado continuamente con stakeholders

**P6. ¿Los ítems del backlog tienen criterios de aceptación claros antes de entrar al Sprint?**
- Rara vez tienen criterios → Algunos tienen criterios básicos → La mayoría tiene criterios antes del Sprint → Todos tienen criterios claros y el equipo los revisó

**P7. ¿El Product Goal está definido y el equipo lo conoce?**
- No existe Product Goal formal → Existe pero pocos en el equipo lo conocen → El equipo lo conoce pero no lo usa para tomar decisiones → El Product Goal guía el refinamiento y priorización

---

#### Sección 3 de 6 — Autoorganización y entrega

**P8. ¿El equipo se autoorganiza para lograr el Sprint Goal sin necesitar asignación externa de tareas?**
- El líder o PM asigna todas las tareas → Hay algo de autoorganización pero con dependencia externa → El equipo mayormente se organiza solo → Plena autoorganización; el equipo decide cómo lograr el Goal

**P9. ¿El Increment al final de cada Sprint cumple la Definition of Done y está potencialmente entregable?**
- No tenemos Definition of Done → Tenemos DoD pero rara vez se cumple → Se cumple en la mayoría de Sprints → Siempre; cada Sprint produce un Increment usable

**P10. ¿El equipo tiene las habilidades necesarias para entregar valor completo (cross-functional)?**
- Hay muchas dependencias externas para completar ítems → Dependencias frecuentes en algunas áreas → Mayormente autónomo, pocas dependencias → Totalmente cross-functional; entrega completa sin externos

**P11. ¿Qué tan bien maneja el equipo el WIP (work in progress) para evitar cuellos de botella?**
- Sin límite de WIP; varios ítems empezados y sin terminar → El WIP crece sin control en cada Sprint → Hay cierta conciencia pero sin límites formales → Limitamos WIP activamente para maximizar el flujo

---

#### Sección 4 de 6 — Transparencia, inspección y adaptación

**P12. ¿El equipo y stakeholders tienen visibilidad real del progreso y los impedimentos?**
- La información está fragmentada o desactualizada → Hay visibilidad parcial en algunas áreas → Buena visibilidad, con algunas brechas → Transparencia total; el Scrum Board refleja la realidad

**P13. ¿El equipo adapta su plan basándose en lo aprendido durante el Sprint?**
- El plan no cambia una vez iniciado el Sprint → Adaptaciones mínimas, generalmente al final → Adaptaciones frecuentes con base en la evidencia → Inspección y adaptación continua; el plan es una guía viva

**P14. ¿Los valores de Scrum (compromiso, coraje, foco, apertura, respeto) son visibles en el día a día?**
- Rara vez se manifiestan en las interacciones → Algunos valores están presentes de forma inconsistente → La mayoría de valores se practican habitualmente → Los valores son parte de la cultura del equipo

---

#### Sección 5 de 6 — Excelencia técnica

**P15. ¿El equipo tiene integración continua (CI) que detecta errores automáticamente?**
- No hay CI; el build es manual o esporádico → CI configurado pero con fallos frecuentes no resueltos → CI estable; los fallos se resuelven antes de continuar → CI + CD; despliegues automatizados frecuentes y fiables

**P16. ¿El equipo tiene pruebas automatizadas que generan confianza para hacer cambios?**
- Sin pruebas automatizadas → Algunas pruebas pero con cobertura muy baja → Buena cobertura en áreas críticas del sistema → Suite sólida de pruebas; se refactoriza y despliega con confianza

**P17. ¿El equipo gestiona activamente la deuda técnica?**
- No se reconoce ni se habla de deuda técnica → Se reconoce pero nunca se prioriza → Se incluye en el backlog y se prioriza con criterio → Se gestiona como parte del refinamiento y de la Definition of Done

---

#### Sección 6 de 6 — Orientación al cliente

**P18. ¿El equipo tiene contacto directo con usuarios o clientes reales?**
- Nunca; todo pasa a través del PO o Management → Raramente, solo en demos formales → Ocasionalmente en Sprint Reviews o entrevistas puntuales → Regularmente; el equipo valida hipótesis directamente con usuarios

**P19. ¿El equipo mide si lo que entrega genera valor real para el negocio o el usuario?**
- No se mide impacto; solo se cuentan features entregadas → Hay algunas métricas de negocio pero no se revisan con regularidad → Seguimiento de métricas clave por producto en cada Sprint Review → Cultura de experimentación: hipótesis → medición → aprendizaje

**P20. ¿El equipo entiende el 'por qué' de negocio detrás de cada ítem del backlog?**
- Rara vez se explica el propósito de negocio de los ítems → A veces, cuando se pregunta explícitamente → El PO explica el valor esperado en el refinamiento → El equipo cuestiona y co-diseña la solución basado en el problema real

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
| Ceremonias | El Sprint Goal no existe o no guía las decisiones. Definir un objetivo de negocio claro y medible para cada Sprint. | El Sprint Goal existe pero no conecta con el Product Goal. Trabajar en que cada Sprint Goal sea un paso concreto hacia el Product Goal. | Profundizar en que cada Sprint Review sea una sesión de inspección/adaptación del Product Backlog basada en feedback real y métricas. |
| Product Backlog | Definir Product Goal inspirador; escribir User Stories con criterios de aceptación claros. | Implementar refinamiento regular; evaluar WSJF o Kano para priorización por valor. | Conectar ítems con Product Goal; explorar Impact Mapping u OKRs para entrega estratégica. |
| Dev Team | Estar disponible durante el Sprint para clarificaciones rápidas — la accesibilidad del PO es crítica. | Asegurar que las User Stories lleguen al Sprint Planning con suficiente detalle. Trabajar con el SM para eliminar dependencias externas. | Involucrarse en la DoD para que refleje los criterios de calidad que el negocio realmente necesita. |
| Transparencia | Hacer el Product Backlog visible a todos. Definir métricas simples de progreso hacia el Product Goal. | Compartir activamente el Product Goal en cada Sprint Review; conectar Sprint Backlog con objetivos de negocio. | Rastrear métricas de outcome (impacto en negocio), no solo output (features entregadas). |
| Exc. Técnica | Exigir que la DoD incluya pruebas automatizadas básicas — sin esto cada Increment acumula riesgo oculto. | Asegurar que la deuda técnica tenga visibilidad en el backlog y se priorice regularmente, no solo en crisis. | Conectar métricas técnicas (frecuencia de despliegue, tasa de fallos) con los objetivos de negocio del Product Goal. |
| Orient. Cliente | Facilitar acceso a usuarios reales: organizar entrevistas, invitar clientes a Sprint Reviews. Sin feedback real, el backlog es especulación. | Definir métricas de outcome claras (retención, adopción, NPS) y revisarlas en cada Sprint Review. | Evolucionar hacia un modelo de descubrimiento continuo: entrevistas semanales, experimentos rápidos, ajuste del Product Goal con datos reales. |

#### Dev Team

| Dimensión | 0–33% | 34–66% | 67–100% |
|-----------|-------|--------|---------|
| Ceremonias | Apropiarse del Daily (15 min orientados al Sprint Goal); co-crear el Sprint Plan. | En el Daily, preguntar si se está en camino al Sprint Goal. En la Retro, generar 1–2 compromisos concretos con dueño. | Profundizar en que la Retro genere mejoras sistémicas; que el Sprint Review sea una conversación real sobre el valor entregado. |
| Product Backlog | Exigir sesiones de refinamiento regulares; hacer preguntas técnicas; identificar riesgos antes de comprometerse. | Involucrarse activamente: rechazar Stories sin criterios de aceptación claros en el Sprint Planning. | Conectar Stories con el "por qué" de negocio para tomar mejores decisiones técnicas durante el Sprint. |
| Dev Team | Definir DoD que todos validen; distribuir el conocimiento. Cada miembro debe poder trabajar en cualquier tarea. | Rotar tareas, implementar pair programming, mapear y eliminar dependencias externas frecuentes. | Implementar límites de WIP; medir cycle time; mejorar el flujo para mayor predictibilidad. |
| Transparencia | Mantener el Scrum Board actualizado en tiempo real. Sin visibilidad compartida no hay inspección posible. | Escalar impedimentos en el Daily antes de que bloqueen el Sprint Goal. | Incorporar métricas de flujo (burndown, velocity, cycle time) para retrospectivas basadas en datos. |
| Exc. Técnica | Definir DoD con pruebas automatizadas y configurar CI mínimo. Sin esto, entregar con frecuencia es arriesgado. | Aumentar cobertura de tests en áreas críticas; estabilizar CI; incluir deuda técnica en el backlog como ítem de valor. | Evolucionar hacia CD y gestión proactiva de deuda técnica. Medir DORA metrics para seguir mejorando. |
| Orient. Cliente | Pedir al PO que comparta métricas de uso y organice sesiones de observación de usuarios. Entender el problema real mejora las decisiones técnicas. | Involucrarse en entrevistas de usuario y Sprint Reviews con stakeholders reales. | Conectar métricas técnicas (performance, fiabilidad) con métricas de experiencia de usuario. |

#### Scrum Master

| Dimensión | 0–33% | 34–66% | 67–100% |
|-----------|-------|--------|---------|
| Ceremonias | Facilitar formación sobre el propósito de cada evento Scrum. El Sprint Planning debe terminar con un Sprint Goal comprometido por todos. | Mejorar calidad de facilitación; que el Daily sea del equipo (no dirigido al SM); que la Retro genere compromisos medibles con dueño. | Lograr que el equipo sea autónomo en la facilitación — el SM no debería ser facilitador permanente. |
| Product Backlog | Facilitar la relación PO-equipo; organizar las primeras sesiones de refinamiento; ayudar al PO a escribir User Stories con criterios claros. | Observar sesiones de refinamiento; identificar malentendidos; educar en escritura de historias y estimación relativa. | Apoyar al PO en conectar backlog con métricas de valor; explorar priorización avanzada (WSJF, Cost of Delay). |
| Dev Team | Crear espacios seguros para que el equipo tome decisiones; empezar con autoselección de tareas en el Sprint Planning. | Mapear dependencias externas e impedimentos sistémicos; trabajar con la organización para eliminarlos. | Trabajar en métricas de equipo (velocity, predictibilidad) y evolucionar la DoD para incrementar calidad continuamente. |
| Transparencia | Establecer Scrum Board visible; formar al equipo sobre su importancia para la inspección y adaptación. | Crear registro de impedimentos visible y dar seguimiento a su resolución — genera confianza en el proceso. | Crear dashboard de métricas de flujo para conversaciones basadas en datos con stakeholders y decisiones más informadas en la Retro. |
| Exc. Técnica | Facilitar la conversación sobre la DoD incluyendo criterios de calidad técnica. Conectar con el equipo para entender impedimentos estructurales. | Hacer visible la deuda técnica en el backlog; facilitar la conversación con el PO para priorizarla. Un equipo con deuda descontrolada no puede ser predecible. | Trabajar en adoptar métricas de ingeniería (deployment frequency, lead time for changes) para mejoras basadas en datos objetivos. |
| Orient. Cliente | Facilitar sesiones de mapeo de valor donde el equipo visualice cómo su trabajo llega al usuario final. Sin esta conexión, el equipo optimiza procesos en lugar de valor. | Trabajar con el PO para establecer métricas de outcome en el concepto del Sprint. Cuando el equipo ve el impacto, la motivación y calidad de decisiones mejoran. | Facilitar la incorporación de feedback de usuario en las Retrospectivas. El aprendizaje sobre el cliente debe informar tanto el proceso como la estrategia del producto. |

---

## Base de datos (Firestore)

### Colecciones

#### `usuarios`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `nombre` | string | Nombre del workspace admin |
| `email` | string | Email de acceso |
| `role` | string | `'super_admin'` o `'admin'` |
| `activo` | boolean | `true` = acceso permitido, `false` = suspendido |
| `creadoEn` | timestamp | Fecha de creación de la cuenta |

#### `equipos`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `nombre` | string | Nombre del equipo |
| `activo` | boolean | Si el equipo está disponible en el formulario |
| `ownerId` | string | UID del workspace admin que creó el equipo |
| `notas` | object | Notas del coach por ciclo `{ [cicloKey]: string }` — solo visibles en el panel admin |

#### `workspaces`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `briefingTexto` | string | Texto de encuadre que el participante ve antes del formulario (vacío = sin pantalla de briefing) |
| `marca` | string | Nombre de marca del workspace (reemplaza "Assessment de Madurez Agile" en el formulario y reportes) |
| `logoUrl` | string | URL del logo — reemplaza el título de texto por una imagen |
| `colorAcento` | string | Color HEX que sustituye al azul (#1a4fd6) por defecto en formulario y reportes |

Acceso: lectura pública (formulario lo lee sin login), escritura solo por el propio workspace admin.

#### `ciclos`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `nombre` | string | Nombre del ciclo (ej: "Q1 2025") |
| `activo` | boolean | Ciclo actualmente activo |
| `ownerId` | string | UID del workspace admin que creó el ciclo |

#### `respuestas`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `equipoId` | string | ID del documento del equipo |
| `equipoNombre` | string | Nombre del equipo (desnormalizado) |
| `participante` | string | Nombre del participante ("Anónimo" si no completó) |
| `rol` | string | Rol: Product Owner / Dev Team / Scrum Master / Otro |
| `ciclo` | string | Nombre del ciclo activo al momento del envío |
| `tamanoEquipo` | string | Tamaño del equipo: "1–5" / "6–9" / "10+" (opcional) |
| `tiempoScrum` | string | Tiempo usando Scrum: "<6 meses" / "6–18 meses" / ">18 meses" (opcional) |
| `scoreEventos` | number | Puntaje bruto de la dimensión Ceremonias |
| `scoreBacklog` | number | Puntaje bruto de la dimensión Product Backlog |
| `scoreDevTeam` | number | Puntaje bruto de la dimensión Dev Team |
| `scoreTransparencia` | number | Puntaje bruto de la dimensión Transparencia |
| `scoreTecnico` | number | Puntaje bruto de la dimensión Excelencia Técnica |
| `scoreCliente` | number | Puntaje bruto de la dimensión Orientación al Cliente |
| `scoreTotalPct` | number | Porcentaje total (0–100) |
| `nivel` | string | Etiqueta del nivel de madurez |
| `answers` | object | Respuestas individuales por pregunta (índice → valor 0–3) |
| `comments` | object | Comentarios abiertos por sección (sectionId → string, opcional) |
| `fecha` | timestamp | Timestamp del servidor al momento del envío |

#### `planes`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `equipoId` | string | ID del equipo al que aplica el plan |
| `equipoNombre` | string | Nombre del equipo (desnormalizado) |
| `iniciativa` | string | Descripción de la acción de mejora |
| `responsable` | string | Persona responsable de la acción |
| `fecha` | string | Fecha objetivo (formato YYYY-MM-DD) |
| `estado` | string | Estado: "Pendiente" / "En progreso" / "Completado" |
| `ciclo` | string | Ciclo en que se creó la acción |
| `dimension` | string | Dimensión objetivo (key de DIMS, opcional) |

#### `reportes`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `equipoId` | string | ID del equipo del snapshot |
| `equipoNombre` | string | Nombre del equipo (desnormalizado) |
| `ciclo` | string | Ciclo filtrado al generar el reporte ("Todos" si sin filtro) |
| `ownerId` | string | UID del admin que generó el reporte |
| `generatedAt` | timestamp | Fecha de generación |
| `expiresAt` | timestamp | Fecha de expiración (30 días desde generación) |
| `branding` | object | Branding del workspace al momento de generación: `{ marca, logoUrl, colorAcento }` |
| `data` | object | Snapshot con avgTotal, level, avgDims, dims, radarValues, roleStats, dispersion, recommendations |

Acceso: lectura pública (cualquiera con el token), creación autenticada, eliminación solo por owner o super_admin.

---

## Exportación de datos

Desde el panel admin se puede exportar:

| Formato | Contenido |
|---------|-----------|
| **PDF análisis** | Reporte de análisis completo (impresión optimizada vía `window.print()`) |
| **PDF plan de acción** | Acciones agrupadas por estado (En curso → Pendiente → Completado) en ventana nueva |
| **Reporte compartible** | Link `reporte.html?t=TOKEN` — snapshot público sin login, válido 30 días, con botón "↓ Descargar PDF" |
| **CSV resumen** | Promedio por equipo y dimensión |
| **CSV detalle** | Todas las respuestas individuales con metadatos |

---

## Mejoras implementadas

### Plan coaching V1 (completado)

| Prioridad | Mejora | Descripción |
|-----------|--------|-------------|
| Alta | `assessment-config.js` | Fuente única de verdad para preguntas, niveles, dimensiones y recomendaciones. Ambos HTML lo cargan como script externo. |
| Alta | Dispersión / alineación del equipo | Cada tarjeta de equipo muestra badge "Alineación Alta/Media/Baja" (basado en desviación estándar) y rango min–max por dimensión cuando hay 2+ respuestas. |
| Alta | Plan de Acción | Nueva pestaña en admin con acciones de mejora por equipo: iniciativa, responsable, fecha, estado y ciclo. Persiste en colección Firestore `planes`. |
| Alta | Gráfico de radar por equipo | Cada tarjeta de equipo en la pestaña Análisis muestra un spider chart con las 6 dimensiones. Usa Chart.js 4.4.3. Los puntos tienen el color de cada dimensión. |
| Media | Nuevas dimensiones | 2 dimensiones nuevas: **Excelencia Técnica** (CI/CD, tests, deuda técnica) y **Orientación al Cliente** (contacto con usuarios, métricas de valor). 14 → **20 preguntas**, 4 → **6 dimensiones**, 42 → **60 pts máx**. |
| Media | Contexto del equipo | Campos opcionales en el intro: tamaño del equipo (1–5 / 6–9 / 10+) y tiempo usando Scrum (<6 / 6–18 / >18 meses). Se guardan en Firestore y se incluyen en exportación CSV. |
| Media | QR code por equipo | Botón QR en cada equipo del admin genera un modal con QR + URL copiable. La URL incluye `?workspaceId=` para pre-seleccionar el workspace en el formulario público. |
| Media | Exportación Plan de Acción PDF | Botón en la pestaña Plan de Acción que genera un PDF con acciones agrupadas por estado (En curso → Pendiente → Completado), resumen de conteos y filtros de equipo/ciclo aplicados. |
| Media | Nota contextual por rol en el formulario | Cuando un participante entra a una sección cuya perspectiva principal no es su rol, el formulario muestra una instrucción contextual (ej: PO en sección Dev Team). Preserva el dato cruzado entre roles. |
| Media | Secciones colapsables + histogramas por pregunta | Las recomendaciones y el detalle por pregunta son colapsables por equipo. El detalle muestra mini histogramas de 4 barras (distribución de respuestas 0–3) por pregunta, agrupados por dimensión. |
| Media | Preguntas abiertas por sección | Textarea opcional al final de cada sección del formulario: "¿Qué está bloqueando más a tu equipo en esta área?". Se guarda en Firestore y se muestra en el panel como citas anónimas agrupadas por dimensión. |
| Media | Vinculación Plan ↔ Evolución | Campo Dimensión en planes. En la pestaña Evolución se muestran los planes vinculados a la dimensión seleccionada con delta y badge de estado. |
| Media | Comparativa multi-equipo | Card "Comparativa por dimensión" en Análisis con radar superpuesto (N equipos, colores distintos) y tabla heatmap por equipo × dimensión (semáforo verde/ámbar/rojo). Visible con ≥2 equipos con datos. |
| Media | Reporte compartible para stakeholders | Botón "↗ Compartir reporte" en cada tarjeta de equipo. Genera snapshot en `reportes/{token}` (válido 30 días) y muestra el link. `reporte.html` sirve la vista pública: radar, barras, roles, recomendaciones y botón PDF. |
| Media | Manejo diferenciado del rol "Otro" | Toggle "Excluir Otro" en la pestaña Análisis (visible solo si hay respuestas con ese rol). Excluye esas respuestas de los promedios globales y de tarjetas de equipo al ver "Todos". N de respuestas visible en cada pill de rol. |
| Baja | Prevención de duplicados | Aviso informativo si el participante ya respondió en el ciclo activo (detección vía localStorage, sin bloquear el formulario). |
| Baja | Evolución por pregunta | Las respuestas individuales se guardan como objeto `answers` en Firestore. En la pestaña Evolución aparece un detalle por pregunta con % del último ciclo y delta (▲/▼) respecto al anterior. |
| Fix | Acceso sin workspaceId bloqueado | El formulario público sin `?workspaceId=X` en la URL muestra un mensaje de error en lugar de listar equipos de todos los workspaces. Previene leak de privacidad entre workspaces. |

### Plan V2 — Fase 1 (completada 2026-04-10)

| # | Mejora | Descripción |
|---|--------|-------------|
| #4 | Notas del coach por equipo y ciclo | Textarea al pie de cada tarjeta de equipo en Análisis. Guardado automático con debounce en `equipos/{id}.notas.{ciclo}`. Draft en memoria preserva el texto durante re-renders. |
| #6 | Umbral de anonimato | Constante `MIN_ROLE_RESPONSES=3`. Pills con ⚠ si un rol tiene menos respuestas en el ciclo activo. Banner de advertencia al filtrar ese rol. En el card org, roles bajo umbral se excluyen con nota explicativa. |
| #19 | Historial de reportes compartidos | Sección en pestaña Equipos: lista todos los reportes activos con equipo, ciclo, fechas de generación/expiración y botón Revocar. Cargado en `fetchAllData()` con query por `ownerId`. |
| #20 | Contador de respuestas en tiempo real | `onSnapshot` sobre `respuestas` — detecta nuevas respuestas sin refrescar y actualiza automáticamente. Badge en el header de cada tarjeta: azul con conteo del ciclo activo, rojo con ↓ si está por debajo del ciclo anterior. |
| #5 | Briefing pre-assessment personalizable | El coach edita el texto en pestaña Equipos (guardado en `workspaces/{uid}` vía debounce). Si está configurado, el participante ve una pantalla de briefing antes del formulario. Sin texto, el flujo es idéntico al anterior. |

---

### Plan V2 — Fase 2 (completada 2026-04-11)

| # | Mejora | Commit | Descripción |
|---|--------|--------|-------------|
| #10 | Análisis de consistencia por pregunta | `0f7c479` | `isPolarized(counts)`: suma de extremos (0+3) ≥50% con ambos presentes y ≥3 respuestas. Badge "Opiniones divididas" (ámbar) inline en el histograma de la pregunta. |
| #9 | Índice de momentum de mejora | `0311cff` | `calcMomentum(tid, role, n=3)`: delta promedio por ciclo en los últimos n ciclos. Indicador ↗/→/↘ + pts/ciclo debajo del badge de nivel en la tarjeta. Solo visible con ≥2 ciclos. |
| #1 | Detección de divergencia entre roles | `5631870` | `detectRoleGaps(tid, cycleFilter, threshold=25)`: compara roles con ≥MIN respuestas. Sección colapsable "⚡ Brechas de percepción" en la tarjeta (fondo ámbar). Badge ⚡ Xpts en cada barra de dimensión (naranja ≥25pts, rojo ≥40pts). |
| #7 | Tendencia histórica por dimensión | `d507341` | `initEvolutionTrendChart()` + card con `<canvas>` en pestaña Evolución. Gráfico de líneas Chart.js (una línea por dimensión, mismos colores). Solo visible con ≥3 ciclos. Usa patrón `window._evolTrendData`. |
| #3 | Guía de debriefing auto-generada | `aeeb628` | `COACHING_QUESTIONS` en `assessment-config.js` (3 preguntas × 3 niveles × 6 dims). `generateDebriefGuide(tid, cf)` retorna top 3 oportunidades + preguntas, celebraciones, gaps. Botón "Guía de facilitación" abre ventana imprimible. 12 tests nuevos (suite total: 92). |

---

### Plan V2 — Fase 3 (en curso)

| # | Mejora | Commit | Descripción |
|---|--------|--------|-------------|
| #16 | White-label básico | `352b690` | Campos `marca`, `logoUrl`, `colorAcento` en `workspaces/{uid}`. Editor de marca en pestaña Equipos (guardado automático). `assessment-agile.html` aplica nombre, logo y color al cargar. `reporte.html` aplica el branding almacenado en el snapshot del reporte. |
| #11 | Portal de equipo | — | Pendiente |
| #12 | Estados por equipo | — | Pendiente (depende de #11) |
| #14 | Preguntas personalizables | — | Pendiente |
| #13 | Recordatorios de ciclo | — | Bloqueado — requiere SendGrid o dominio verificado |

---

## Historial de versiones (commits clave)

| Commit | Descripción |
|--------|-------------|
| `352b690` | Feat: white-label básico — marca, logoUrl, colorAcento en workspaces; aplicado en formulario y reportes (#16 V2) |
| `aeeb628` | Feat: guía de debriefing auto-generada — COACHING_QUESTIONS + generateDebriefGuide + ventana imprimible (#3 V2) |
| `d507341` | Feat: tendencia histórica por dimensión — gráfico de líneas Chart.js en pestaña Evolución (#7 V2) |
| `5631870` | Feat: detección de divergencia de percepción entre roles — sección colapsable y badges ⚡ por dimensión (#1 V2) |
| `0311cff` | Feat: índice de momentum — indicador ↗/→/↘ con delta promedio por ciclo en tarjeta de equipo (#9 V2) |
| `0f7c479` | Feat: análisis de consistencia por pregunta — badge "Opiniones divididas" en histogramas polarizados (#10 V2) |
| `86abfc4` | Feat: briefing pre-assessment personalizable — pantalla de encuadre antes del formulario (#5 V2) |
| `412812e` | Feat: contador de respuestas en tiempo real con onSnapshot y badge de comparación vs. ciclo anterior (#20 V2) |
| `8370eb1` | Feat: historial de reportes compartidos en pestaña Equipos con botón Revocar (#19 V2) |
| `36bae12` | Feat: umbral de anonimato MIN=3 — pills ⚠, banner advertencia y exclusión en card org (#6 V2) |
| `1aee758` | Feat: notas del coach por equipo y ciclo — textarea con debounce en `equipos/{id}.notas` (#4 V2) |
| `5bf4d35` | Docs: PLAN_MEJORAS_V2.md — 20 mejoras en 4 fases, roadmap Q2 2026 – Q1 2027 |
| `8a7c607` | Fix: bloquear acceso al formulario sin workspaceId — muestra error en lugar de listar todos los equipos |
| `4d33ea7` | Feat: toggle "Excluir Otro" del promedio, N de respuestas en pills de rol (#10) |
| `0770bc7` | Feat: botón "↓ Descargar PDF" en reporte compartible |
| `5a5d325` | Feat: reporte compartible para stakeholders — `reporte.html`, `reportes/{token}`, botón en tarjetas (#5) |
| `4ce2d8f` | Docs: actualizar MDs con mejoras #4 y #6 completadas |
| `1c7c6c6` | Feat: preguntas abiertas por sección y citas anónimas en panel admin |
| `871c0e1` | Feat: comparativa multi-equipo — radar superpuesto + tabla heatmap |
| `d0bd0cd` | Feat: vinculación Plan de Acción ↔ dimensiones en pestaña Evolución |
| `2550209` | Feat: secciones colapsables y detalle por pregunta con histogramas |
| `1f1aec6` | Feat: exportar Plan de Acción a PDF con agrupación por estado |
| `90b6b29` | Feat: gráfico de radar por equipo en pestaña Análisis (Chart.js) |
| `d494e7a` | Feat: nota contextual por rol en secciones del formulario |
| (anterior) | Fix: restaurar foco y cursor en inputs controlados tras re-render |
| (anterior) | CI/CD: GitHub Actions — lint+tests en cada push/PR, deploy automático a Firebase en push a main |
| (anterior) | Tests: suite Vitest — 92 tests en scoring (25), analysis (50) y evolution (17) |
| (anterior) | Refactor: estado centralizado — objeto `state` + `setState(patch)` |
| (anterior) | Refactor: separar admin.html en módulos — assets/ con css, state, api, render, export, auth |
| (anterior) | Feat: Cloud Functions para gestión de usuarios + Firestore rules server-side + plan Blaze |
| (anterior) | Feat: sistema multi-tenant — Firebase Auth, pestaña Usuarios, filtrado por ownerId |
| `58e5a14` | Feat: mejoras assessment — config centralizada, 6 dimensiones, contexto equipo, alineación, plan de acción, QR, evolución por pregunta |
| `1f0c8d4` | Feat: migración a Firebase + ciclos de medición + exportación + filtros por rol |
| `2d0d339` | Initial commit |
