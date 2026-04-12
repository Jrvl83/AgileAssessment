// ── Assessment Configuration ─────────────────────────────────────
// Fuente única de verdad para datos compartidos entre
// assessment-agile.html y admin.html

const SECTIONS = [
  {
    id:"eventos", tag:"Sección 1 de 6", title:"Ceremonias y ritmo del equipo",
    desc:"Cómo el equipo vive los eventos definidos en la Scrum Guide", role:"PO + Dev Team",
    questions:[
      { text:"¿Con qué frecuencia se realiza la Sprint Planning y genera un Sprint Goal claro?",
        opts:["Nunca o rara vez","A veces, pero el Goal es vago","Casi siempre con Goal definido","Siempre; el Goal guía cada decisión del Sprint"], weight:1.5 },
      { text:"¿El Daily Scrum se usa para inspeccionar el progreso hacia el Sprint Goal y adaptar el plan?",
        opts:["No hacemos Daily o es un reporte de estado","Hacemos Daily pero sin foco en el Goal","Mayormente nos enfocamos en el Goal","El Daily es una herramienta real de adaptación diaria"] },
      { text:"¿La Sprint Review involucra a stakeholders reales y genera feedback accionable?",
        opts:["No hacemos Review o es solo interna","Hay stakeholders pero el feedback no se incorpora","A veces logramos feedback útil","Siempre; los stakeholders influyen el Product Backlog"] },
      { text:"¿La Retrospectiva produce mejoras concretas que se implementan en el siguiente Sprint?",
        opts:["No hacemos Retro","Hacemos Retro pero sin compromisos concretos","Definimos mejoras pero pocas se implementan","Las mejoras se rastrean y se implementan sistemáticamente"] }
    ]
  },
  {
    id:"backlog", tag:"Sección 2 de 6", title:"Gestión del Product Backlog",
    desc:"Evaluación desde la perspectiva del Product Owner", role:"Product Owner",
    questions:[
      { text:"¿El Product Backlog está ordenado por valor y refleja las necesidades reales de los usuarios?",
        opts:["No está ordenado o no existe claro","Está ordenado por esfuerzo o cronología","Ordenado parcialmente por valor","Ordenado por valor, revisado continuamente con stakeholders"] },
      { text:"¿Los ítems del backlog tienen criterios de aceptación claros antes de entrar al Sprint?",
        opts:["Rara vez tienen criterios","Algunos tienen criterios básicos","La mayoría tiene criterios antes del Sprint","Todos tienen criterios claros y el equipo los revisó"] },
      { text:"¿El Product Goal está definido y el equipo lo conoce?",
        opts:["No existe Product Goal formal","Existe pero pocos en el equipo lo conocen","El equipo lo conoce pero no lo usa para tomar decisiones","El Product Goal guía el refinamiento y priorización"], weight:1.5 }
    ]
  },
  {
    id:"devteam", tag:"Sección 3 de 6", title:"Autoorganización y entrega",
    desc:"Capacidades técnicas y de autogestión del equipo de desarrollo", role:"Dev Team",
    questions:[
      { text:"¿El equipo se autoorganiza para lograr el Sprint Goal sin necesitar asignación externa de tareas?",
        opts:["El líder o PM asigna todas las tareas","Hay algo de autoorganización pero con dependencia externa","El equipo mayormente se organiza solo","Plena autoorganización; el equipo decide cómo lograr el Goal"] },
      { text:"¿El Increment al final de cada Sprint cumple la Definition of Done y está potencialmente entregable?",
        opts:["No tenemos Definition of Done","Tenemos DoD pero rara vez se cumple","Se cumple en la mayoría de Sprints","Siempre; cada Sprint produce un Increment usable"], weight:1.5 },
      { text:"¿El equipo tiene las habilidades necesarias para entregar valor completo (cross-functional)?",
        opts:["Hay muchas dependencias externas para completar ítems","Dependencias frecuentes en algunas áreas","Mayormente autónomo, pocas dependencias","Totalmente cross-functional; entrega completa sin externos"] },
      { text:"¿Qué tan bien maneja el equipo el WIP (work in progress) para evitar cuellos de botella?",
        opts:["Sin límite de WIP; varios ítems empezados y sin terminar","El WIP crece sin control en cada Sprint","Hay cierta conciencia pero sin límites formales","Limitamos WIP activamente para maximizar el flujo"] }
    ]
  },
  {
    id:"transparencia", tag:"Sección 4 de 6", title:"Transparencia, inspección y adaptación",
    desc:"Adhesión a los pilares empíricos del proceso", role:"PO + Dev Team + SM",
    questions:[
      { text:"¿El equipo y stakeholders tienen visibilidad real del progreso y los impedimentos?",
        opts:["La información está fragmentada o desactualizada","Hay visibilidad parcial en algunas áreas","Buena visibilidad, con algunas brechas","Transparencia total; el Scrum Board refleja la realidad"] },
      { text:"¿El equipo adapta su plan basándose en lo aprendido durante el Sprint?",
        opts:["El plan no cambia una vez iniciado el Sprint","Adaptaciones mínimas, generalmente al final","Adaptaciones frecuentes con base en la evidencia","Inspección y adaptación continua; el plan es una guía viva"] },
      { text:"¿Los valores de Scrum (compromiso, coraje, foco, apertura, respeto) son visibles en el día a día?",
        opts:["Rara vez se manifiestan en las interacciones","Algunos valores están presentes de forma inconsistente","La mayoría de valores se practican habitualmente","Los valores son parte de la cultura del equipo"], weight:1.5 },
      { text:"¿El equipo identifica y escala los impedimentos para que se resuelvan dentro del Sprint?",
        opts:["Los impedimentos no se identifican o permanecen bloqueados varias semanas sin dueño","Se mencionan en el Daily pero nadie los escala; el equipo los asume como parte del trabajo","La mayoría se escalan y se resuelven, aunque algunos quedan sin seguimiento","Los impedimentos se identifican, escalan y resuelven sistemáticamente antes de que bloqueen el Sprint Goal"] }
    ]
  },
  {
    id:"tecnico", tag:"Sección 5 de 6", title:"Excelencia técnica",
    desc:"Prácticas de ingeniería que sostienen la agilidad y la calidad de entrega", role:"Dev Team",
    altDesc:"Calidad y mejora continua del proceso en equipos de trabajo de conocimiento",
    altQuestions:[
      { text:"¿El equipo revisa entre pares el trabajo antes de considerarlo terminado?",
        opts:["Rara vez o nunca; el trabajo se entrega sin revisión","Se revisa a veces pero sin criterios claros","La mayoría del trabajo pasa por revisión de pares","Revisión sistemática con criterios de calidad compartidos"] },
      { text:"¿El equipo tiene criterios de aceptación claros para sus entregables?",
        opts:["Los entregables no tienen criterios de calidad definidos","Hay criterios informales pero inconsistentes","La mayoría de entregables tiene criterios antes de empezar","Criterios claros acordados en equipo; guían cada entregable"] },
      { text:"¿El equipo gestiona activamente los problemas de proceso (retrabajos, inconsistencias, flujos rotos)?",
        opts:["No se reconoce ni se habla de problemas de proceso","Se reconoce pero no se prioriza ni se aborda","Se identifican y se abordan esporádicamente","La mejora del proceso es parte del ritmo habitual del equipo"] }
    ],
    questions:[
      { text:"¿El equipo tiene integración continua (CI) que detecta errores automáticamente?",
        opts:["No hay CI; el build es manual o esporádico","CI configurado pero con fallos frecuentes no resueltos","CI estable; los fallos se resuelven antes de continuar","CI + CD; despliegues automatizados frecuentes y fiables"] },
      { text:"¿El equipo tiene pruebas automatizadas que generan confianza para hacer cambios?",
        opts:["Sin pruebas automatizadas","Algunas pruebas pero con cobertura muy baja","Buena cobertura en áreas críticas del sistema","Suite sólida de pruebas; se refactoriza y despliega con confianza"] },
      { text:"¿El equipo gestiona activamente la deuda técnica?",
        opts:["No se reconoce ni se habla de deuda técnica","Se reconoce pero nunca se prioriza","Se incluye en el backlog y se prioriza con criterio","Se gestiona como parte del refinamiento y de la Definition of Done"] }
    ]
  },
  {
    id:"cliente", tag:"Sección 6 de 6", title:"Orientación al cliente",
    desc:"Conexión del equipo con usuarios reales y generación de valor medible", role:"PO + Dev Team",
    questions:[
      { text:"¿El equipo tiene contacto directo con usuarios o clientes reales?",
        opts:["Nunca; todo pasa a través del PO o Management","Raramente, solo en demos formales","Ocasionalmente en Sprint Reviews o entrevistas puntuales","Regularmente; el equipo valida hipótesis directamente con usuarios"] },
      { text:"¿El equipo mide si lo que entrega genera valor real para el negocio o el usuario?",
        opts:["No se mide impacto; solo se cuentan features entregadas","Hay algunas métricas de negocio pero no se revisan con regularidad","Seguimiento de métricas clave por producto en cada Sprint Review","Cultura de experimentación: hipótesis → medición → aprendizaje"] },
      { text:"¿El equipo entiende el 'por qué' de negocio detrás de cada ítem del backlog?",
        opts:["Rara vez se explica el propósito de negocio de los ítems","A veces, cuando se pregunta explícitamente","El PO explica el valor esperado en el refinamiento","El equipo cuestiona y co-diseña la solución basado en el problema real"] }
    ]
  }
];

const LEVELS = [
  { max:40,  label:"Inicial",       color:"#c0282a", bg:"#fce8e8", desc:"El equipo conoce Scrum en teoría pero la práctica es inconsistente. Alta dependencia de procesos externos." },
  { max:65,  label:"En desarrollo", color:"#a05c0a", bg:"#fdefd6", desc:"Adopción parcial de Scrum. Los eventos ocurren pero el valor generado aún no se optimiza." },
  { max:82,  label:"Maduro",        color:"#1a4fd6", bg:"#dce6ff", desc:"Scrum está bien incorporado. El equipo entrega valor consistentemente y mejora de forma continua." },
  { max:100, label:"Avanzado",      color:"#0d7a52", bg:"#d4f0e5", desc:"Equipo de alto rendimiento ágil. El empirismo guía cada decisión; la mejora continua es parte del ADN." }
];

const DIMS = [
  { key:'eventos',       label:'Ceremonias',        max:12, color:'#1a4fd6', field:'Score Eventos',       storeKey:'scoreEventos' },
  { key:'backlog',       label:'Product Backlog',    max:9,  color:'#0d7a52', field:'Score Backlog',        storeKey:'scoreBacklog' },
  { key:'devteam',       label:'Dev Team',           max:12, color:'#a05c0a', field:'Score Dev Team',       storeKey:'scoreDevTeam' },
  { key:'transparencia', label:'Transparencia',      max:12, color:'#7c3aed', field:'Score Transparencia',  storeKey:'scoreTransparencia' },
  { key:'tecnico',       label:'Exc. Técnica',       max:9,  color:'#0891b2', field:'Score Técnico',        storeKey:'scoreTecnico' },
  { key:'cliente',       label:'Orient. Cliente',    max:9,  color:'#db2777', field:'Score Cliente',        storeKey:'scoreCliente' }
];

const DIM_COLORS = Object.fromEntries(DIMS.map(d => [d.key, d.color]));

const RECS = {
  eventos: [
    "Las ceremonias no se realizan de forma consistente. Establecer el ritmo básico: Sprint Planning con Goal claro, Daily de 15 minutos orientado al objetivo y Sprint Review con stakeholders reales. Sin eventos regulares no hay empirismo posible.",
    "Las ceremonias ocurren pero sin el propósito correcto. Trabajar en la calidad del Sprint Goal — debe ser retador y guiar cada decisión del Sprint. El Daily debe adaptarse al plan, no ser un reporte de estado.",
    "Buena base en ceremonias. Profundizar en que el Sprint Goal alinee realmente con stakeholders y en que la Retro produzca mejoras rastreables de sprint a sprint.",
    "Las ceremonias son de alta calidad y el equipo las domina. El reto ahora es evolucionar el Sprint Goal hacia hipótesis de negocio medibles y que la Retro genere experimentos sistémicos, no solo mejoras de proceso. Explorar OKRs a nivel de sprint para conectar el trabajo diario con el impacto estratégico."
  ],
  backlog: [
    "El Product Backlog no cumple su función. Definir un Product Goal claro y ordenar los ítems por valor de negocio. Sin priorización real el equipo no puede decidir qué construir primero.",
    "El backlog existe pero la priorización no refleja valor real. Invertir en refinamiento regular donde el PO trabaje con el equipo para definir criterios de aceptación antes de cada Sprint Planning.",
    "Buena gestión del backlog. Explorar técnicas de priorización por valor (WSJF, Kano) y asegurar que el Product Goal guíe activamente cada decisión de refinamiento.",
    "La gestión del backlog es una fortaleza. El siguiente nivel es conectar cada Sprint con outcomes medibles: ¿cuánto de lo entregado cambió el comportamiento del usuario? Explorar Continuous Discovery, hypothesis-driven development y JTBD para que el backlog refleje aprendizajes de producto, no solo funcionalidades."
  ],
  devteam: [
    "El equipo no se autoorganiza y depende de asignación externa. Establecer una Definition of Done y empoderar al equipo para que decida cómo lograr el Sprint Goal sin dirección externa.",
    "Hay autoorganización parcial con dependencias frecuentes. Mapear las dependencias externas y planificar cómo internalizar esas habilidades para entregar valor completo.",
    "El equipo tiene buena autonomía. Implementar límites de WIP para maximizar el flujo y asegurar que cada Sprint produzca un Increment completamente integrado y potencialmente entregable.",
    "El equipo es autónomo y entrega con consistencia. La evolución ahora es hacia métricas de flujo — lead time, cycle time y DORA metrics — para identificar cuellos de botella sistémicos. Explorar Team Topologies para optimizar las interacciones con otros equipos y reducir la carga cognitiva del sistema."
  ],
  transparencia: [
    "La transparencia es muy baja. Empezar con un Scrum Board visible y actualizado en tiempo real. Sin visibilidad compartida no es posible inspeccionar ni adaptar el proceso.",
    "Hay visibilidad parcial pero los impedimentos no fluyen bien. Trabajar en identificar y escalar impedimentos rápidamente, y en que la Retro genere compromisos concretos y medibles.",
    "Buena transparencia. Evolucionar hacia métricas de flujo (burndown, velocity, cycle time) para proyecciones más predictibles y retrospectivas basadas en datos.",
    "La transparencia es total y el empirismo está integrado. El siguiente reto es que los artefactos Scrum evolucionen hacia herramientas de decisión estratégica: el Product Goal como hipótesis de negocio medible, y las métricas de flujo como lenguaje común con la organización para informar decisiones de cartera de producto."
  ],
  tecnico: [
    "El equipo no tiene prácticas de ingeniería que soporten la agilidad. Sin CI ni pruebas automatizadas, entregar valor con frecuencia es arriesgado. Empezar definiendo una DoD que incluya pruebas básicas y configurar un pipeline de CI mínimo.",
    "Hay prácticas técnicas parciales. Aumentar la cobertura de pruebas en las áreas de mayor riesgo y estabilizar el CI para que los fallos sean visibles inmediatamente. Incluir la deuda técnica en el backlog y priorizarla como cualquier otro ítem de valor.",
    "Buena base técnica. Evolucionar hacia CD (despliegue continuo) y gestión proactiva de la deuda técnica como parte del refinamiento regular y de la Definition of Done.",
    "La excelencia técnica es real. El siguiente nivel es hacerla visible: medir DORA metrics (deployment frequency, lead time for changes, MTTR, change fail rate) como indicadores de capacidad organizacional. Explorar platform engineering para reducir la carga cognitiva del equipo y habilitar experimentación continua de producto sin fricción técnica."
  ],
  cliente: [
    "El equipo construye sin validar con usuarios reales. Establecer al menos contacto mínimo: incluir usuarios en Sprint Reviews o hacer una entrevista mensual. Sin feedback real, el equipo optimiza suposiciones en lugar de valor.",
    "El contacto con el cliente es esporádico. Definir métricas de negocio claras para cada Product Goal y revisar su evolución en cada Sprint Review. La validación de hipótesis debería guiar la priorización del backlog.",
    "Buena orientación al cliente. Evolucionar hacia un modelo de experimentación explícito: definir hipótesis, medir impacto y ajustar la estrategia del producto en función de los datos reales.",
    "La orientación al cliente es un activo diferencial. Institucionalizar el descubrimiento continuo: entrevistas semanales, Opportunity Solution Trees (Teresa Torres) y un Product Goal expresado como outcome medible con métricas de validación claras. El backlog debería ser la historia viva de los aprendizajes del equipo sobre el problema del cliente."
  ]
};

const RECS_ROLE = {
  'Product Owner': {
    tecnico: [
      "El equipo no puede entregar con frecuencia porque la base técnica no lo soporta. Como PO, exige que la Definition of Done incluya pruebas automatizadas básicas — sin esto, cada Increment acumula riesgo oculto que frena la velocidad futura.",
      "Las prácticas técnicas son parciales. Asegúrate de que la deuda técnica tenga visibilidad en el backlog y sea priorizada regularmente, no solo cuando hay una crisis. Un equipo técnicamente sano entrega más valor con menos riesgo.",
      "Buena base técnica. Trabaja con el equipo para conectar las métricas técnicas (frecuencia de despliegue, tasa de fallos) con los objetivos de negocio del Product Goal.",
      "La capacidad técnica del equipo es una ventaja competitiva. Trabaja con ellos para conectar las DORA metrics con tu roadmap: un equipo que puede desplegar múltiples veces al día puede experimentar y aprender a una velocidad que ningún documento de especificación puede capturar."
    ],
    cliente: [
      "El equipo no valida con usuarios reales. Tu primera prioridad es facilitar ese acceso: organiza entrevistas de usuario, invita clientes reales a Sprint Reviews y comparte insights con el equipo. Sin feedback real, el backlog es especulación.",
      "El contacto con el cliente es ocasional. Define métricas de outcome claras (retención, adopción, NPS) y revísalas en cada Sprint Review. El valor entregado se mide en el comportamiento del usuario, no en features completadas.",
      "Excelente orientación al cliente. Evoluciona hacia un modelo de descubrimiento continuo: entrevistas semanales, experimentos rápidos y ajuste del Product Goal basado en aprendizajes reales del mercado.",
      "La orientación al cliente es tu fortaleza más valiosa. Institucionaliza el descubrimiento continuo: entrevistas semanales, Opportunity Solution Trees y un Product Goal expresado como hipótesis de negocio con métricas de validación. El backlog debería ser la historia de los aprendizajes del equipo sobre el problema del cliente, no un inventario de funcionalidades."
    ],
    eventos: [
      "El Sprint Goal no existe o no guía las decisiones del Sprint. Como PO, tu primera prioridad es definir un objetivo de negocio claro y medible para cada Sprint. Sin Sprint Goal, el equipo no puede priorizar ni rechazar trabajo durante el Sprint.",
      "El Sprint Goal existe pero no conecta con el Product Goal. Trabaja en que cada Sprint Goal sea un paso concreto hacia el Product Goal. En la Sprint Review, enfoca la conversación en valor de negocio validado, no solo en funcionalidades demostradas.",
      "Buena práctica de ceremonias. Profundiza en que cada Sprint Review sea una sesión de inspección y adaptación del Product Backlog basada en feedback real de stakeholders y métricas de negocio.",
      "Las ceremonias funcionan perfectamente. Eleva la calidad del Sprint Goal: que sea una hipótesis de negocio con métricas de validación claras que el equipo pueda inspeccionar durante el Sprint. La Sprint Review debería responder siempre la pregunta: ¿validamos o refutamos nuestra hipótesis este Sprint?"
    ],
    backlog: [
      "El Product Backlog no cumple su función. Define un Product Goal inspirador y ordena el backlog por valor de negocio. Empieza escribiendo User Stories con criterios de aceptación claros — sin esto el equipo no puede comprometerse en el Sprint Planning.",
      "La priorización no refleja valor real. Implementa refinamiento regular donde trabajes con el equipo definiendo criterios de aceptación antes del Sprint Planning. Evalúa WSJF o Kano para priorizar con datos de negocio.",
      "Buena gestión del backlog. Conecta cada ítem explícitamente con el Product Goal y explora Impact Mapping u OKRs para asegurar que cada Sprint entrega valor estratégico, no solo funcionalidad.",
      "La gestión del backlog es tu fortaleza. El siguiente nivel es conectar explícitamente cada Sprint con outcomes medibles: ¿cuánto de lo entregado cambió el comportamiento del usuario? Explora hypothesis-driven development y OKRs de producto para que el backlog sea un mapa de aprendizajes, no una lista de funcionalidades."
    ],
    devteam: [
      "El equipo no puede autoorganizarse sin contexto de negocio. Estate disponible durante el Sprint para aclarar dudas rápidamente — tu accesibilidad es crítica para que el equipo tome decisiones sin esperar.",
      "Hay dependencias que frenan al equipo. Revisa si las User Stories llegan al Sprint Planning con suficiente detalle y criterios claros. Trabaja con el Scrum Master para eliminar las dependencias externas que el equipo no puede resolver solo.",
      "Buena colaboración con el equipo. Involúcrate en definir la Definition of Done para que refleje los criterios de calidad que el negocio realmente necesita, no solo los criterios técnicos.",
      "El equipo es completamente autónomo. Tu palanca de mayor impacto ahora es el contexto estratégico: compartir los datos de uso real, las métricas de negocio y el roadmap de aprendizajes para que el equipo tome decisiones técnicas alineadas con el valor real que hay que entregar."
    ],
    transparencia: [
      "La transparencia del producto es baja. El Product Backlog debe ser visible a todos los stakeholders. Define métricas sencillas de progreso hacia el Product Goal para poder inspeccionar si el equipo va por buen camino.",
      "Hay visibilidad parcial. Mejora compartiendo el Product Goal activamente en cada Sprint Review y conectando el Sprint Backlog con los objetivos de negocio para que los stakeholders entiendan el valor que se está creando.",
      "Excelente transparencia. Evoluciona hacia métricas de outcome (impacto en el negocio) en lugar de output (funcionalidades entregadas) para demostrar el valor real del trabajo del equipo.",
      "La transparencia es total. Evoluciona los artefactos Scrum hacia herramientas de comunicación estratégica: el Product Goal como hipótesis de negocio medible, las métricas de outcome visibles para toda la organización. El objetivo es que el backlog cuente la historia del aprendizaje del producto, no solo el historial de entregas."
    ]
  },
  'Dev Team': {
    tecnico: [
      "La base técnica frena la agilidad del equipo. Empezad definiendo una Definition of Done que incluya pruebas automatizadas y configurando CI para que los errores se detecten en minutos, no en días. Sin esto, cada Sprint acumula deuda que tarde o temprano bloquea al equipo.",
      "Hay prácticas técnicas pero son inconsistentes. Aumentad la cobertura de tests en las partes más críticas y estableced el hábito de refactorizar durante cada Sprint. La deuda técnica debe rastrearse visiblemente en el backlog, no gestionarse en silencio.",
      "Excelente base técnica. Avanzad hacia despliegue continuo y gestión explícita de la deuda técnica en el refinamiento. Medir DORA metrics (lead time, deployment frequency, MTTR) os dará datos para seguir mejorando.",
      "La excelencia técnica es vuestra fortaleza. El siguiente nivel es hacerla visible hacia la organización: medir DORA metrics y conectar deployment frequency con la capacidad del equipo para experimentar y aprender. Un equipo que despliega múltiples veces al día puede invalidar una hipótesis antes de que se convierta en deuda de producto."
    ],
    cliente: [
      "El equipo construye sin ver el impacto en los usuarios. Pedid al PO que comparta métricas de uso y organice al menos una sesión de observación de usuarios por trimestre. Entender el problema real cambia cómo se toman decisiones técnicas.",
      "El contacto con el cliente es esporádico. Involucrarse en las entrevistas de usuario y en las Sprint Reviews con stakeholders reales. Cuando el equipo entiende el 'para quién' y el 'por qué', las decisiones técnicas mejoran significativamente.",
      "Gran orientación al cliente. Conectad las métricas técnicas (performance, fiabilidad) con métricas de experiencia de usuario. Un sistema técnicamente excelente que no resuelve el problema del usuario no genera valor.",
      "La orientación al cliente es genuina. El siguiente nivel es incorporar métricas de experiencia de usuario en vuestras decisiones técnicas — performance, fiabilidad y accesibilidad como parte de la DoD — y participar activamente en el descubrimiento continuo para que el equipo co-diseñe el espacio del problema con el PO."
    ],
    eventos: [
      "Las ceremonias no generan valor para el equipo. Apropiáos del Daily: 15 minutos orientados al Sprint Goal, no un reporte de tareas al Scrum Master. El Sprint Planning debe terminar con un plan co-creado que el equipo crea factible.",
      "Las ceremonias ocurren pero son rituales vacíos. En el Daily, preguntad: ¿estamos en camino al Sprint Goal, hay algo que nos bloquea? En la Retro, generad 1-2 compromisos concretos con dueño y revisad su cumplimiento en la siguiente.",
      "Buena práctica. Profundizad en que la Retro genere mejoras sistémicas (proceso, técnica, colaboración) y en que el Sprint Review sea una conversación real con stakeholders sobre el valor entregado.",
      "Las ceremonias son de alta calidad. El siguiente nivel es la facilitación distribuida: que el equipo sea capaz de conducir sus propios eventos sin necesitar al SM como facilitador, y que la Retro evolucione hacia experimentos sistémicos con hipótesis medibles y revisión explícita de resultados."
    ],
    backlog: [
      "El equipo llega al Sprint Planning sin entender los ítems. Exigid sesiones de refinamiento regulares con el PO donde podáis hacer preguntas técnicas, identificar riesgos y estimar con confianza antes de comprometerse.",
      "La participación en el refinamiento es irregular. Involucrarse activamente: si una User Story llega al Sprint Planning sin criterios de aceptación claros, es legítimo no aceptarla. El equipo co-crea el Sprint Backlog.",
      "Buena participación en el backlog. Avanzad en conectar cada User Story con el 'por qué' de negocio para que el equipo pueda tomar mejores decisiones técnicas durante el Sprint.",
      "La participación en el backlog es excelente. El siguiente nivel es co-diseñar el espacio del problema con el PO: entender las hipótesis de negocio detrás de cada ítem y proponer alternativas técnicas que validen las mismas hipótesis con menor esfuerzo o mayor aprendizaje."
    ],
    devteam: [
      "El equipo depende de asignación externa. Empezad por definir una Definition of Done que todos validen. Cada miembro debe poder trabajar en cualquier tarea del Sprint — la autoorganización requiere responsabilidad colectiva.",
      "Hay autoorganización parcial y silos de especialización. Rotad tareas, implementad pair programming o code reviews para distribuir el conocimiento. Las dependencias externas frecuentes deben mapearse y eliminarse.",
      "Excelente autonomía. Implementad límites de WIP para reducir el multitasking y maximizar el flujo. Medir el cycle time ayuda a identificar cuellos de botella y hacer proyecciones más fiables.",
      "El equipo opera con autonomía real. El siguiente nivel es la mejora continua basada en datos: lead time, cycle time y deployment frequency como palancas para identificar cuellos de botella sistémicos. Explorar Team Topologies para optimizar las interacciones con otros equipos y reducir la carga cognitiva del sistema."
    ],
    transparencia: [
      "El Scrum Board no refleja la realidad. Cada miembro es responsable de actualizarlo en tiempo real. Sin visibilidad compartida el equipo no puede colaborar ni identificar impedimentos antes de que bloqueen el Sprint Goal.",
      "La visibilidad existe pero los impedimentos no se escalan a tiempo. Cread el hábito de levantar impedimentos en el Daily antes de que bloqueen el Sprint. El Scrum Master os ayuda a eliminarlos, pero primero deben ser visibles.",
      "Gran transparencia. Incorporad métricas de flujo (burndown, velocity, cycle time) para hacer retrospectivas basadas en datos y proyecciones más predictibles para los stakeholders.",
      "La transparencia es total. El siguiente nivel es usar los datos para influir en la organización: compartid métricas de flujo con stakeholders en lenguaje de negocio y co-cread con el PO dashboards de outcome que demuestren el valor generado, no solo el trabajo realizado."
    ]
  },
  'Scrum Master': {
    tecnico: [
      "Las prácticas técnicas débiles son un impedimento sistémico. Facilita la conversación sobre la DoD incluyendo criterios de calidad técnica. Conecta con el equipo técnico para entender las dependencias e impedimentos estructurales que frenan la velocidad.",
      "Hay prácticas técnicas pero el equipo no las prioriza sistemáticamente. Ayuda a hacer visible la deuda técnica en el backlog y facilita la conversación con el PO para que sea priorizada. Un equipo con deuda técnica no controlada no puede ser predecible.",
      "Buena base técnica. Trabaja con el equipo en adoptar métricas de ingeniería (deployment frequency, lead time for changes) para que las conversaciones de mejora se basen en datos objetivos.",
      "La excelencia técnica del equipo es sólida. Tu palanca ahora es sistémica: conectar las DORA metrics con los objetivos de negocio y facilitar conversaciones con la organización sobre cómo la capacidad técnica del equipo habilita mayor velocidad de aprendizaje de producto."
    ],
    cliente: [
      "El equipo está desconectado del impacto de su trabajo. Facilita sesiones de mapeo de valor donde el equipo visualice cómo su trabajo llega al usuario final. Sin esta conexión, el equipo optimiza procesos en lugar de valor.",
      "Hay contacto esporádico con el cliente. Trabaja con el PO para establecer métricas de outcome en el Definition of Done conceptual del Sprint. Cuando el equipo ve el impacto de su trabajo, la motivación y la calidad de las decisiones mejoran.",
      "Excelente orientación al cliente. Facilita la incorporación de feedback de usuario en las Retrospectivas. El aprendizaje sobre el cliente debería informar tanto la mejora del proceso como la estrategia del producto.",
      "El equipo tiene contacto directo y continuo con los usuarios. Tu rol ahora es facilitar que ese aprendizaje se integre estructuralmente en el proceso: que las Retros incluyan insights de usuario y que el equipo comparta un mapa de oportunidades actualizado con el PO. El descubrimiento continuo debería ser tan natural como el Daily."
    ],
    eventos: [
      "Las ceremonias no tienen el propósito correcto. Facilita sesiones de formación sobre el propósito de cada evento Scrum. El Sprint Planning debe terminar con un Sprint Goal comprometido por todos, no solo con una lista de tareas.",
      "Las ceremonias ocurren pero son superficiales. Mejora la calidad de facilitación: usa técnicas para que el Daily sea del equipo (no dirigido al SM) y que la Retro genere compromisos medibles con dueño.",
      "Buenas ceremonias. Enfócate en que el equipo sea autónomo en la facilitación — tu objetivo es hacer que los eventos fluyan bien sin necesitarte como facilitador permanente.",
      "Las ceremonias son de alta calidad. Tu objetivo ahora es hacerte prescindible como facilitador: que el equipo conduzca sus propios eventos con plena propiedad. Dedica tu energía a facilitar conversaciones sistémicas sobre cómo el sistema de trabajo del equipo puede evolucionar más allá de los eventos Scrum."
    ],
    backlog: [
      "El PO y el equipo no colaboran en el backlog. Facilita la relación: organiza las primeras sesiones de refinamiento, ayuda al PO a escribir User Stories con criterios claros y al equipo a estimar con confianza.",
      "El refinamiento ocurre pero podría ser más efectivo. Observa las sesiones e identifica dónde se generan malentendidos. Educa al PO en técnicas de escritura de historias y al equipo en estimación relativa.",
      "Buena gestión del backlog. Apoya al PO en conectar el backlog con métricas de valor y explora con el equipo técnicas de priorización avanzadas como WSJF o Cost of Delay.",
      "La relación PO-equipo es excelente. Tu palanca ahora es estratégica: facilitar que el equipo conecte el trabajo con los outcomes de negocio, apoyar al PO en técnicas de discovery continuo y asegurarte de que el backlog refleje aprendizajes reales del mercado, no solo solicitudes de stakeholders."
    ],
    devteam: [
      "El equipo no se autoorganiza. Crea espacios seguros para que tome decisiones: empieza con que el equipo elija sus propias tareas en el Sprint Planning. Identifica y elimina las dependencias externas que impiden la autonomía.",
      "Hay autoorganización parcial. Mapea las dependencias externas e impedimentos sistémicos que frenan al equipo. Trabajar con la organización para eliminarlos es tu palanca de mayor impacto como SM.",
      "Buen nivel de autoorganización. Trabaja en métricas de equipo (velocity, predictibilidad) y ayúdales a evolucionar la DoD para incrementar la calidad del Increment continuamente.",
      "El equipo tiene plena autonomía y entrega con consistencia. Tu rol evoluciona hacia el nivel organizacional: remover impedimentos sistémicos, facilitar la interacción con otros equipos y representar las necesidades del equipo en conversaciones de diseño organizacional."
    ],
    transparencia: [
      "La transparencia es el pilar más urgente. Establece un Scrum Board visible y forma al equipo en la importancia de actualizarlo. Sin artefactos que reflejen la realidad, la inspección y adaptación son imposibles.",
      "Hay visibilidad parcial. Trabaja en que los impedimentos sean visibles antes de que escalen: crea un registro de impedimentos visible y da seguimiento a su resolución — esto genera confianza en el proceso.",
      "Gran transparencia. Evoluciona hacia un dashboard de métricas de flujo que permita conversaciones basadas en datos con stakeholders y decisiones de mejora más informadas en la Retro.",
      "La transparencia interna es excelente. El siguiente nivel es la transparencia hacia la organización: ayudar al equipo a comunicar su valor en términos de outcomes medibles, facilitar conversaciones de OKRs entre el equipo y la dirección, y asegurarte de que los artefactos Scrum evolucionan hacia herramientas de decisión estratégica."
    ]
  }
};

const CROSS_PATTERNS = [
  {
    dims: ['eventos', 'transparencia', 'backlog', 'devteam', 'tecnico', 'cliente'],
    maxPct: 40,
    label: 'Adopción inicial total',
    color: '#c0282a',
    text: 'Todas las dimensiones están en nivel inicial. Scrum se conoce en teoría pero no se practica consistentemente. El equipo necesita acompañamiento estructurado para establecer las bases antes de aspirar a la optimización.'
  },
  {
    dims: ['eventos', 'transparencia'],
    maxPct: 50,
    label: 'Base Scrum débil',
    color: '#a05c0a',
    text: 'Ceremonias y Transparencia bajas simultáneamente indican que los pilares básicos de Scrum no están establecidos. Antes de optimizar otras dimensiones, los eventos deben ocurrir con consistencia y el progreso debe ser visible para todo el equipo.'
  },
  {
    dims: ['devteam', 'tecnico'],
    maxPct: 45,
    label: 'Limitación técnica sistémica',
    color: '#0891b2',
    text: 'Dev Team y Excelencia Técnica bajas simultáneamente indican que el equipo tiene dificultades tanto para autoorganizarse como para mantener prácticas de ingeniería sólidas. Priorizar la Definition of Done y las pruebas automatizadas como punto de partida.'
  },
  {
    dims: ['backlog', 'cliente'],
    maxPct: 45,
    label: 'Desconexión del valor',
    color: '#7c3aed',
    text: 'Backlog y Orientación al Cliente bajas simultáneamente sugieren que el equipo construye sin entender bien qué genera valor real. Establecer contacto directo con usuarios y ordenar el backlog por valor de negocio son los primeros pasos.'
  }
];

// ── Preguntas de coaching para la guía de debriefing ─────────────
// 3 niveles: [0] 0–33% (Inicial), [1] 34–66% (En desarrollo), [2] 67–100% (Maduro/Avanzado)
// 3 preguntas por nivel
const COACHING_QUESTIONS = {
  eventos: [
    [
      "¿Qué impide que el equipo realice el Sprint Planning de forma consistente? ¿Hay una fecha fija reservada?",
      "¿Cómo sería para el equipo tener un Sprint Goal claro antes de empezar cada Sprint? ¿Qué cambiaría?",
      "¿Qué pasaría si el equipo cancelara el Daily durante un Sprint completo? ¿Qué información perdería?"
    ],
    [
      "¿El Sprint Goal del último Sprint guió alguna decisión concreta durante ese Sprint? ¿Pueden dar un ejemplo?",
      "¿Cómo sería una Retrospectiva perfecta para este equipo? ¿En qué se diferencia de la que hacen ahora?",
      "¿Los stakeholders que asisten a la Sprint Review dan feedback que cambia el Product Backlog? ¿Cuándo fue la última vez?"
    ],
    [
      "¿Hay algún evento Scrum que el equipo rediseñaría si pudiera hacerlo desde cero?",
      "¿Cómo miden si el Sprint Goal se cumplió? ¿Qué lo haría aún más claro para el equipo?",
      "¿Qué podría hacer que sus ceremonias dejaran de funcionar tan bien? ¿Qué protegerían activamente?"
    ]
  ],
  backlog: [
    [
      "¿Si tuvieras que elegir una cosa del backlog para construir mañana, cuál sería y por qué? ¿Coincide con lo que está en el tope?",
      "¿El equipo sabe cuál es el Product Goal? ¿Alguien puede recitarlo sin mirarlo?",
      "¿Qué pasaría si el equipo no tuviera PO durante un Sprint? ¿Qué decisiones no podrían tomar?"
    ],
    [
      "¿Cuándo fue la última vez que refinaron ítems con criterios de aceptación claros antes del Sprint Planning?",
      "¿Hay ítems en el backlog de hace más de 3 meses? ¿Siguen siendo relevantes? ¿Qué dice eso de la priorización?",
      "¿El equipo puede explicar el valor de negocio de cada ítem del Sprint Backlog actual?"
    ],
    [
      "¿Cómo conecta el Sprint Goal actual con el Product Goal? ¿El equipo puede articularlo con sus propias palabras?",
      "¿Cómo priorizan cuando dos ítems parecen igual de importantes? ¿Hay un criterio explícito y compartido?",
      "¿Qué información adicional haría que el equipo se sintiera más seguro al comprometerse en el Sprint Planning?"
    ]
  ],
  devteam: [
    [
      "¿Cómo deciden cada mañana en qué trabaja cada uno? ¿Hay alguien externo que lo decide por el equipo?",
      "¿Cuántos ítems están en progreso simultáneamente ahora mismo? ¿Cómo se siente el equipo con ese número?",
      "¿Tienen una Definition of Done? ¿Todos la conocen y la aplican de la misma forma?"
    ],
    [
      "¿Hay tareas que siempre hace la misma persona? ¿Qué pasaría si esa persona no estuviera disponible esta semana?",
      "¿En el último Sprint hubo ítems que no se completaron por dependencias externas al equipo? ¿Cuántos?",
      "¿Cuándo fue la última vez que entregaron un Increment al final del Sprint que cumplía completamente la DoD?"
    ],
    [
      "¿El WIP actual permite que el equipo se enfoque? ¿Hay algún momento del Sprint donde el flujo se atasca?",
      "¿Cómo deciden cuándo parar de trabajar en algo y pedir ayuda? ¿Hay un criterio explícito en el equipo?",
      "¿Qué habilidad le falta al equipo para ser completamente cross-functional? ¿Hay un plan para desarrollarla?"
    ]
  ],
  transparencia: [
    [
      "¿Si un stakeholder quisiera saber hoy el estado del Sprint, dónde lo vería? ¿Está actualizado en este momento?",
      "¿Cuándo fue el último impedimento que se escaló? ¿Cuánto tiempo tardó en resolverse?",
      "¿Los valores de Scrum se mencionan en las conversaciones del equipo? ¿Cuándo fue la última vez?"
    ],
    [
      "¿Hay información sobre el progreso del equipo que solo algunas personas conocen? ¿Qué pasaría si todos la supieran?",
      "¿Los impedimentos que identifica el equipo en el Daily se resuelven dentro del Sprint o se arrastran varios?",
      "¿Hay algo que el equipo sabe pero que no se dice en las reuniones? ¿Qué impediría decirlo abiertamente?"
    ],
    [
      "¿Las métricas que usan actualmente reflejan valor entregado o solo trabajo realizado?",
      "¿Cómo sabe el equipo que la Retro está funcionando? ¿Pueden dar un ejemplo de una mejora del último mes?",
      "¿Qué información adicional ayudaría al equipo a tomar mejores decisiones cada día?"
    ]
  ],
  tecnico: [
    [
      "¿Qué pasaría si mañana necesitaran hacer un despliegue de emergencia? ¿Cuánto tardaría y qué riesgo habría?",
      "¿Hay partes del código que 'nadie quiere tocar'? ¿Qué dice eso de la salud técnica del sistema?",
      "¿Tienen Definition of Done con criterios técnicos como pruebas o revisión de código? ¿Se cumple siempre?"
    ],
    [
      "¿Cuándo fue la última vez que la deuda técnica impidió completar un ítem del Sprint? ¿Está visible en el backlog?",
      "¿Qué porcentaje del código crítico tiene pruebas automatizadas? ¿Cómo se sienten con ese número?",
      "¿El CI detecta errores antes de que lleguen a producción? ¿Cuándo fue el último fallo que llegó a prod?"
    ],
    [
      "¿Qué métrica técnica usarían para mostrarle a un ejecutivo que el equipo puede escalar sin acumular riesgo?",
      "¿Cuánto tarda desde que un cambio se aprueba hasta que llega a producción? ¿Qué podría acortarlo?",
      "¿Cómo gestionan el balance entre nueva funcionalidad y mejora técnica? ¿Hay un criterio explícito?"
    ]
  ],
  cliente: [
    [
      "¿Cuándo fue la última vez que alguien del equipo habló directamente con un usuario? ¿Qué aprendieron?",
      "¿El equipo sabe si los features del último Sprint están siendo usados? ¿Cómo lo saben?",
      "¿Si tuvieran 5 minutos para mostrar el valor entregado este mes a la dirección, qué mostrarían?"
    ],
    [
      "¿Tienen métricas de negocio que revisen regularmente? ¿Cuál fue la última decisión del backlog que cambió por datos de uso?",
      "¿Qué hipótesis de negocio están probando en el Sprint actual? ¿Cómo sabrán si se confirmó?",
      "¿Los stakeholders de la última Sprint Review dieron feedback que cambió algún ítem del backlog? ¿Cuál?"
    ],
    [
      "¿Qué experimento de producto querría hacer el equipo que aún no ha podido hacer? ¿Qué lo impide?",
      "¿Cómo conectan las métricas de negocio que siguen con las decisiones técnicas diarias del equipo?",
      "¿Hay algún segmento de usuarios cuyas necesidades aún no están bien entendidas? ¿Qué harían para conocerlas?"
    ]
  ]
};

function detectPatterns(dimScores) {
  return CROSS_PATTERNS.filter(p =>
    p.dims.every(k => dimScores[k] && dimScores[k].pct < p.maxPct)
  );
}

function getContextNote(dim, pct, tamano, tiempoScrum) {
  if (!tamano && !tiempoScrum) return null;
  // Antigüedad Scrum — valores legacy (tiempoScrum) y V3 (teamAge)
  const isNew = tiempoScrum === '<6 meses' || tiempoScrum === '< 3 meses' || tiempoScrum === '3–12 meses';
  const isMid = tiempoScrum === '6–18 meses' || tiempoScrum === '1–2 años';
  const isOld = tiempoScrum === '>18 meses' || tiempoScrum === '> 2 años';
  if (isNew && pct < 70)
    return 'Equipo nuevo: priorizar cadencia básica y rituales antes de optimizar.';
  if (isOld && pct < 50)
    return 'Más de 18 meses con Scrum en este nivel sugiere impedimentos sistémicos o resistencia estructural que conviene abordar explícitamente.';
  if (isMid && pct < 40)
    return 'Con 6–18 meses en Scrum, este nivel puede indicar falta de apoyo organizacional o coaching insuficiente.';
  // Tamaño — valores legacy y V3
  const isBig   = tamano === '10+' || tamano === '9+';
  const isSmall = tamano === '1–5' || tamano === '3–5';
  if (isBig && dim === 'eventos' && pct < 70)
    return 'Equipo grande: la coordinación a escala requiere estructura explícita en los eventos Scrum.';
  if (isBig && dim === 'devteam' && pct < 60)
    return 'Equipo grande: la autoorganización es más compleja; considerar sub-equipos o acuerdos explícitos de trabajo.';
  if (isSmall && dim === 'devteam' && pct < 60)
    return 'Equipo pequeño: la cross-funcionalidad es crítica para evitar que una sola persona sea cuello de botella.';
  return null;
}

function getLevel(pct) { return LEVELS.find(l => pct <= l.max) || LEVELS[LEVELS.length - 1]; }

function getRec(dim, pct, role) {
  const idx = pct <= 33 ? 0 : pct <= 66 ? 1 : pct <= 82 ? 2 : 3;
  if (role && RECS_ROLE[role] && RECS_ROLE[role][dim]) return RECS_ROLE[role][dim][idx];
  return RECS[dim][idx];
}

// Preguntas opcionales de salud del equipo (seguridad psicológica)
// Solo se muestran cuando el workspace activa teamHealthEnabled
const HEALTH_QUESTIONS = [
  {
    id: 'health_0',
    text: '¿El equipo se siente seguro para dar feedback crítico en la Retro sin consecuencias negativas?',
    opts: [
      'Rara vez; hay tensión o miedo a hablar con honestidad',
      'A veces, en contextos o con personas específicas',
      'Generalmente sí, aunque con algunas reservas',
      'Siempre; el feedback honesto es bienvenido y normalizado'
    ]
  },
  {
    id: 'health_1',
    text: '¿Los errores se tratan como oportunidades de aprendizaje y no como fallos individuales?',
    opts: [
      'Los errores generan tensión o búsqueda de culpables',
      'Depende del error; algunos se gestionan bien, otros no',
      'Generalmente se aprende de los errores sin señalar responsables',
      'Siempre; la cultura del equipo convierte los fallos en aprendizaje sistémico'
    ]
  },
  {
    id: 'health_2',
    text: '¿Los miembros del equipo pueden plantear problemas y preocupaciones sin miedo a represalias?',
    opts: [
      'Rara vez; las personas guardan para sí sus preocupaciones',
      'Algunas personas lo hacen; otras no se sienten seguras',
      'La mayoría se siente cómoda planteando preocupaciones',
      'Todos; el equipo actúa para que todas las voces sean escuchadas'
    ]
  }
];

// CommonJS exports para tests (no-op en el browser)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SECTIONS, LEVELS, DIMS, RECS, RECS_ROLE, CROSS_PATTERNS, DIM_COLORS, COACHING_QUESTIONS, HEALTH_QUESTIONS, detectPatterns, getContextNote, getLevel, getRec };
}
