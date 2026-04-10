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
├── assessment-agile.html   # Formulario público del assessment
├── admin.html              # Panel de administración — solo HTML + script tags (34 líneas)
├── assessment-config.js    # Fuente única de verdad: preguntas, niveles, dimensiones, recomendaciones
├── assets/
│   ├── admin.css           # Todos los estilos del panel admin
│   ├── admin-state.js      # Firebase init + variables de estado globales
│   ├── admin-api.js        # Funciones Firestore + helpers de cálculo y estadísticas
│   ├── admin-render.js     # Todas las funciones render*, toast, prefillPlan, QR
│   ├── admin-export.js     # exportCSV, exportPDF, exportRaw
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
│   ├── setup.js            # Globals: DIMS, getLevel, state, render stubs
│   ├── scoring.test.js     # Tests: getLevel, getRec, detectPatterns, getContextNote (25 tests)
│   ├── analysis.test.js    # Tests: calcDispersion, getMajorityRole, getTeamFilteredStats, computeStats (24 tests)
│   └── evolution.test.js   # Tests: getEvolutionData (10 tests)
├── functions/
│   ├── index.js            # Cloud Functions: createWorkspaceAdmin, deleteWorkspaceAdmin
│   └── package.json        # Dependencias: firebase-admin, firebase-functions
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
| **Análisis** | Todos | Estadísticas agregadas, madurez por equipo y rol, badge de alineación, gráfico de radar por equipo, recomendaciones, exportación PDF/CSV |
| **Evolución** | Todos | Progreso de equipos a lo largo de ciclos de medición, incluyendo detalle por pregunta con delta vs. ciclo anterior |
| **Equipos** | Todos | Alta, baja y activación de equipos; botón QR por equipo |
| **Plan de Acción** | Todos | Acciones de mejora por equipo: iniciativa, responsable, fecha, estado y ciclo. Exportación a PDF con agrupación por estado |
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
| Alta | `assessment-config.js` | Fuente única de verdad para preguntas, niveles, dimensiones y recomendaciones. Ambos HTML lo cargan como script externo. |
| Alta | Dispersión / alineación del equipo | Cada tarjeta de equipo muestra badge "Alineación Alta/Media/Baja" (basado en desviación estándar) y rango min–max por dimensión cuando hay 2+ respuestas. |
| Alta | Plan de Acción | Nueva pestaña en admin con acciones de mejora por equipo: iniciativa, responsable, fecha, estado y ciclo. Persiste en colección Firestore `planes`. |
| Alta | Gráfico de radar por equipo | Cada tarjeta de equipo en la pestaña Análisis muestra un spider chart con las 6 dimensiones. Usa Chart.js 4.4.3. Los puntos tienen el color de cada dimensión. |
| Media | Nuevas dimensiones | 2 dimensiones nuevas: **Excelencia Técnica** (CI/CD, tests, deuda técnica) y **Orientación al Cliente** (contacto con usuarios, métricas de valor). 14 → **20 preguntas**, 4 → **6 dimensiones**, 42 → **60 pts máx**. |
| Media | Contexto del equipo | Campos opcionales en el intro: tamaño del equipo (1–5 / 6–9 / 10+) y tiempo usando Scrum (<6 / 6–18 / >18 meses). Se guardan en Firestore y se incluyen en exportación CSV. |
| Media | QR code por equipo | Botón QR en cada equipo del admin genera un modal con QR + URL copiable. La URL incluye `?workspaceId=` para pre-seleccionar el workspace en el formulario público. |
| Media | Exportación Plan de Acción PDF | Botón en la pestaña Plan de Acción que genera un PDF con acciones agrupadas por estado (En curso → Pendiente → Completado), resumen de conteos y filtros de equipo/ciclo aplicados. |
| Media | Nota contextual por rol en el formulario | Cuando un participante entra a una sección cuya perspectiva principal no es su rol, el formulario muestra una instrucción contextual (ej: PO en sección Dev Team). Preserva el dato cruzado entre roles. |
| Baja | Prevención de duplicados | Aviso informativo si el participante ya respondió en el ciclo activo (detección vía localStorage, sin bloquear el formulario). |
| Baja | Evolución por pregunta | Las respuestas individuales se guardan como objeto `answers` en Firestore. En la pestaña Evolución aparece un detalle por pregunta con % del último ciclo y delta (▲/▼) respecto al anterior. |

---

## Historial de versiones (commits clave)

| Commit | Descripción |
|--------|-------------|
| `1f1aec6` | Feat: exportar Plan de Acción a PDF con agrupación por estado |
| `90b6b29` | Feat: gráfico de radar por equipo en pestaña Análisis (Chart.js) |
| `d494e7a` | Feat: nota contextual por rol en secciones del formulario |
| `2bae8fa` | Docs: pendiente entregabilidad de correos con SendGrid |
| (anterior) | Fix: restaurar foco y cursor en inputs controlados tras re-render |
| (anterior) | CI/CD: GitHub Actions — lint+tests en cada push/PR, deploy automático a Firebase en push a main |
| (anterior) | Tests: suite Vitest — 59 tests en scoring, analysis y evolution |
| (anterior) | Refactor: estado centralizado — objeto `state` + `setState(patch)` |
| (anterior) | Refactor: separar admin.html en módulos — assets/ con css, state, api, render, export, auth |
| (anterior) | Feat: Cloud Functions para gestión de usuarios + Firestore rules server-side + plan Blaze |
| (anterior) | Feat: sistema multi-tenant — Firebase Auth, pestaña Usuarios, filtrado por ownerId |
| `58e5a14` | Feat: mejoras assessment — config centralizada, 6 dimensiones, contexto equipo, alineación, plan de acción, QR, evolución por pregunta |
| `1f0c8d4` | Feat: migración a Firebase + ciclos de medición + exportación + filtros por rol |
| `2d0d339` | Initial commit |
