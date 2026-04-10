// ── Assessment Configuration ─────────────────────────────────────
// Fuente única de verdad para datos compartidos entre
// assessment-agile.html y admin.html

const SECTIONS = [
  {
    id:"eventos", tag:"Sección 1 de 6", title:"Ceremonias y ritmo del equipo",
    desc:"Cómo el equipo vive los eventos definidos en la Scrum Guide", role:"PO + Dev Team",
    questions:[
      { text:"¿Con qué frecuencia se realiza la Sprint Planning y genera un Sprint Goal claro?",
        opts:["Nunca o rara vez","A veces, pero el Goal es vago","Casi siempre con Goal definido","Siempre; el Goal guía cada decisión del Sprint"] },
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
        opts:["No existe Product Goal formal","Existe pero pocos en el equipo lo conocen","El equipo lo conoce pero no lo usa para tomar decisiones","El Product Goal guía el refinamiento y priorización"] }
    ]
  },
  {
    id:"devteam", tag:"Sección 3 de 6", title:"Autoorganización y entrega",
    desc:"Capacidades técnicas y de autogestión del equipo de desarrollo", role:"Dev Team",
    questions:[
      { text:"¿El equipo se autoorganiza para lograr el Sprint Goal sin necesitar asignación externa de tareas?",
        opts:["El líder o PM asigna todas las tareas","Hay algo de autoorganización pero con dependencia externa","El equipo mayormente se organiza solo","Plena autoorganización; el equipo decide cómo lograr el Goal"] },
      { text:"¿El Increment al final de cada Sprint cumple la Definition of Done y está potencialmente entregable?",
        opts:["No tenemos Definition of Done","Tenemos DoD pero rara vez se cumple","Se cumple en la mayoría de Sprints","Siempre; cada Sprint produce un Increment usable"] },
      { text:"¿El equipo tiene las habilidades necesarias para entregar valor completo (cross-functional)?",
        opts:["Hay muchas dependencias externas para completar ítems","Dependencias frecuentes en algunas áreas","Mayormente autónomo, pocas dependencias","Totalmente cross-functional; entrega completa sin externos"] },
      { text:"¿Qué tan bien maneja el equipo el WIP (work in progress) para evitar cuellos de botella?",
        opts:["Sin límite de WIP; varios ítems empezados y sin terminar","El WIP crece sin control en cada Sprint","Hay cierta conciencia pero sin límites formales","Limitamos WIP activamente para maximizar el flujo"] }
    ]
  },
  {
    id:"transparencia", tag:"Sección 4 de 6", title:"Transparencia, inspección y adaptación",
    desc:"Adhesión a los pilares empíricos del proceso", role:"PO + Dev Team",
    questions:[
      { text:"¿El equipo y stakeholders tienen visibilidad real del progreso y los impedimentos?",
        opts:["La información está fragmentada o desactualizada","Hay visibilidad parcial en algunas áreas","Buena visibilidad, con algunas brechas","Transparencia total; el Scrum Board refleja la realidad"] },
      { text:"¿El equipo adapta su plan basándose en lo aprendido durante el Sprint?",
        opts:["El plan no cambia una vez iniciado el Sprint","Adaptaciones mínimas, generalmente al final","Adaptaciones frecuentes con base en la evidencia","Inspección y adaptación continua; el plan es una guía viva"] },
      { text:"¿Los valores de Scrum (compromiso, coraje, foco, apertura, respeto) son visibles en el día a día?",
        opts:["Rara vez se manifiestan en las interacciones","Algunos valores están presentes de forma inconsistente","La mayoría de valores se practican habitualmente","Los valores son parte de la cultura del equipo"] }
    ]
  },
  {
    id:"tecnico", tag:"Sección 5 de 6", title:"Excelencia técnica",
    desc:"Prácticas de ingeniería que sostienen la agilidad y la calidad de entrega", role:"Dev Team",
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
  { key:'transparencia', label:'Transparencia',      max:9,  color:'#7c3aed', field:'Score Transparencia',  storeKey:'scoreTransparencia' },
  { key:'tecnico',       label:'Exc. Técnica',       max:9,  color:'#0891b2', field:'Score Técnico',        storeKey:'scoreTecnico' },
  { key:'cliente',       label:'Orient. Cliente',    max:9,  color:'#db2777', field:'Score Cliente',        storeKey:'scoreCliente' }
];

const DIM_COLORS = Object.fromEntries(DIMS.map(d => [d.key, d.color]));

const RECS = {
  eventos: [
    "Las ceremonias no se realizan de forma consistente. Establecer el ritmo básico: Sprint Planning con Goal claro, Daily de 15 minutos orientado al objetivo y Sprint Review con stakeholders reales. Sin eventos regulares no hay empirismo posible.",
    "Las ceremonias ocurren pero sin el propósito correcto. Trabajar en la calidad del Sprint Goal — debe ser retador y guiar cada decisión del Sprint. El Daily debe adaptarse al plan, no ser un reporte de estado.",
    "Buena base en ceremonias. Profundizar en que el Sprint Goal alinee realmente con stakeholders y en que la Retro produzca mejoras rastreables de sprint a sprint."
  ],
  backlog: [
    "El Product Backlog no cumple su función. Definir un Product Goal claro y ordenar los ítems por valor de negocio. Sin priorización real el equipo no puede decidir qué construir primero.",
    "El backlog existe pero la priorización no refleja valor real. Invertir en refinamiento regular donde el PO trabaje con el equipo para definir criterios de aceptación antes de cada Sprint Planning.",
    "Buena gestión del backlog. Explorar técnicas de priorización por valor (WSJF, Kano) y asegurar que el Product Goal guíe activamente cada decisión de refinamiento."
  ],
  devteam: [
    "El equipo no se autoorganiza y depende de asignación externa. Establecer una Definition of Done y empoderar al equipo para que decida cómo lograr el Sprint Goal sin dirección externa.",
    "Hay autoorganización parcial con dependencias frecuentes. Mapear las dependencias externas y planificar cómo internalizar esas habilidades para entregar valor completo.",
    "El equipo tiene buena autonomía. Implementar límites de WIP para maximizar el flujo y asegurar que cada Sprint produzca un Increment completamente integrado y potencialmente entregable."
  ],
  transparencia: [
    "La transparencia es muy baja. Empezar con un Scrum Board visible y actualizado en tiempo real. Sin visibilidad compartida no es posible inspeccionar ni adaptar el proceso.",
    "Hay visibilidad parcial pero los impedimentos no fluyen bien. Trabajar en identificar y escalar impedimentos rápidamente, y en que la Retro genere compromisos concretos y medibles.",
    "Buena transparencia. Evolucionar hacia métricas de flujo (burndown, velocity, cycle time) para proyecciones más predictibles y retrospectivas basadas en datos."
  ],
  tecnico: [
    "El equipo no tiene prácticas de ingeniería que soporten la agilidad. Sin CI ni pruebas automatizadas, entregar valor con frecuencia es arriesgado. Empezar definiendo una DoD que incluya pruebas básicas y configurar un pipeline de CI mínimo.",
    "Hay prácticas técnicas parciales. Aumentar la cobertura de pruebas en las áreas de mayor riesgo y estabilizar el CI para que los fallos sean visibles inmediatamente. Incluir la deuda técnica en el backlog y priorizarla como cualquier otro ítem de valor.",
    "Buena base técnica. Evolucionar hacia CD (despliegue continuo) y gestión proactiva de la deuda técnica como parte del refinamiento regular y de la Definition of Done."
  ],
  cliente: [
    "El equipo construye sin validar con usuarios reales. Establecer al menos contacto mínimo: incluir usuarios en Sprint Reviews o hacer una entrevista mensual. Sin feedback real, el equipo optimiza suposiciones en lugar de valor.",
    "El contacto con el cliente es esporádico. Definir métricas de negocio claras para cada Product Goal y revisar su evolución en cada Sprint Review. La validación de hipótesis debería guiar la priorización del backlog.",
    "Buena orientación al cliente. Evolucionar hacia un modelo de experimentación explícito: definir hipótesis, medir impacto y ajustar la estrategia del producto en función de los datos reales."
  ]
};

const RECS_ROLE = {
  'Product Owner': {
    tecnico: [
      "El equipo no puede entregar con frecuencia porque la base técnica no lo soporta. Como PO, exige que la Definition of Done incluya pruebas automatizadas básicas — sin esto, cada Increment acumula riesgo oculto que frena la velocidad futura.",
      "Las prácticas técnicas son parciales. Asegúrate de que la deuda técnica tenga visibilidad en el backlog y sea priorizada regularmente, no solo cuando hay una crisis. Un equipo técnicamente sano entrega más valor con menos riesgo.",
      "Buena base técnica. Trabaja con el equipo para conectar las métricas técnicas (frecuencia de despliegue, tasa de fallos) con los objetivos de negocio del Product Goal."
    ],
    cliente: [
      "El equipo no valida con usuarios reales. Tu primera prioridad es facilitar ese acceso: organiza entrevistas de usuario, invita clientes reales a Sprint Reviews y comparte insights con el equipo. Sin feedback real, el backlog es especulación.",
      "El contacto con el cliente es ocasional. Define métricas de outcome claras (retención, adopción, NPS) y revísalas en cada Sprint Review. El valor entregado se mide en el comportamiento del usuario, no en features completadas.",
      "Excelente orientación al cliente. Evoluciona hacia un modelo de descubrimiento continuo: entrevistas semanales, experimentos rápidos y ajuste del Product Goal basado en aprendizajes reales del mercado."
    ],
    eventos: [
      "El Sprint Goal no existe o no guía las decisiones del Sprint. Como PO, tu primera prioridad es definir un objetivo de negocio claro y medible para cada Sprint. Sin Sprint Goal, el equipo no puede priorizar ni rechazar trabajo durante el Sprint.",
      "El Sprint Goal existe pero no conecta con el Product Goal. Trabaja en que cada Sprint Goal sea un paso concreto hacia el Product Goal. En la Sprint Review, enfoca la conversación en valor de negocio validado, no solo en funcionalidades demostradas.",
      "Buena práctica de ceremonias. Profundiza en que cada Sprint Review sea una sesión de inspección y adaptación del Product Backlog basada en feedback real de stakeholders y métricas de negocio."
    ],
    backlog: [
      "El Product Backlog no cumple su función. Define un Product Goal inspirador y ordena el backlog por valor de negocio. Empieza escribiendo User Stories con criterios de aceptación claros — sin esto el equipo no puede comprometerse en el Sprint Planning.",
      "La priorización no refleja valor real. Implementa refinamiento regular donde trabajes con el equipo definiendo criterios de aceptación antes del Sprint Planning. Evalúa WSJF o Kano para priorizar con datos de negocio.",
      "Buena gestión del backlog. Conecta cada ítem explícitamente con el Product Goal y explora Impact Mapping u OKRs para asegurar que cada Sprint entrega valor estratégico, no solo funcionalidad."
    ],
    devteam: [
      "El equipo no puede autoorganizarse sin contexto de negocio. Estate disponible durante el Sprint para aclarar dudas rápidamente — tu accesibilidad es crítica para que el equipo tome decisiones sin esperar.",
      "Hay dependencias que frenan al equipo. Revisa si las User Stories llegan al Sprint Planning con suficiente detalle y criterios claros. Trabaja con el Scrum Master para eliminar las dependencias externas que el equipo no puede resolver solo.",
      "Buena colaboración con el equipo. Involúcrate en definir la Definition of Done para que refleje los criterios de calidad que el negocio realmente necesita, no solo los criterios técnicos."
    ],
    transparencia: [
      "La transparencia del producto es baja. El Product Backlog debe ser visible a todos los stakeholders. Define métricas sencillas de progreso hacia el Product Goal para poder inspeccionar si el equipo va por buen camino.",
      "Hay visibilidad parcial. Mejora compartiendo el Product Goal activamente en cada Sprint Review y conectando el Sprint Backlog con los objetivos de negocio para que los stakeholders entiendan el valor que se está creando.",
      "Excelente transparencia. Evoluciona hacia métricas de outcome (impacto en el negocio) en lugar de output (funcionalidades entregadas) para demostrar el valor real del trabajo del equipo."
    ]
  },
  'Dev Team': {
    tecnico: [
      "La base técnica frena la agilidad del equipo. Empezad definiendo una Definition of Done que incluya pruebas automatizadas y configurando CI para que los errores se detecten en minutos, no en días. Sin esto, cada Sprint acumula deuda que tarde o temprano bloquea al equipo.",
      "Hay prácticas técnicas pero son inconsistentes. Aumentad la cobertura de tests en las partes más críticas y estableced el hábito de refactorizar durante cada Sprint. La deuda técnica debe rastrearse visiblemente en el backlog, no gestionarse en silencio.",
      "Excelente base técnica. Avanzad hacia despliegue continuo y gestión explícita de la deuda técnica en el refinamiento. Medir DORA metrics (lead time, deployment frequency, MTTR) os dará datos para seguir mejorando."
    ],
    cliente: [
      "El equipo construye sin ver el impacto en los usuarios. Pedid al PO que comparta métricas de uso y organice al menos una sesión de observación de usuarios por trimestre. Entender el problema real cambia cómo se toman decisiones técnicas.",
      "El contacto con el cliente es esporádico. Involucrarse en las entrevistas de usuario y en las Sprint Reviews con stakeholders reales. Cuando el equipo entiende el 'para quién' y el 'por qué', las decisiones técnicas mejoran significativamente.",
      "Gran orientación al cliente. Conectad las métricas técnicas (performance, fiabilidad) con métricas de experiencia de usuario. Un sistema técnicamente excelente que no resuelve el problema del usuario no genera valor."
    ],
    eventos: [
      "Las ceremonias no generan valor para el equipo. Apropiáos del Daily: 15 minutos orientados al Sprint Goal, no un reporte de tareas al Scrum Master. El Sprint Planning debe terminar con un plan co-creado que el equipo crea factible.",
      "Las ceremonias ocurren pero son rituales vacíos. En el Daily, preguntad: ¿estamos en camino al Sprint Goal, hay algo que nos bloquea? En la Retro, generad 1-2 compromisos concretos con dueño y revisad su cumplimiento en la siguiente.",
      "Buena práctica. Profundizad en que la Retro genere mejoras sistémicas (proceso, técnica, colaboración) y en que el Sprint Review sea una conversación real con stakeholders sobre el valor entregado."
    ],
    backlog: [
      "El equipo llega al Sprint Planning sin entender los ítems. Exigid sesiones de refinamiento regulares con el PO donde podáis hacer preguntas técnicas, identificar riesgos y estimar con confianza antes de comprometerse.",
      "La participación en el refinamiento es irregular. Involucrarse activamente: si una User Story llega al Sprint Planning sin criterios de aceptación claros, es legítimo no aceptarla. El equipo co-crea el Sprint Backlog.",
      "Buena participación en el backlog. Avanzad en conectar cada User Story con el 'por qué' de negocio para que el equipo pueda tomar mejores decisiones técnicas durante el Sprint."
    ],
    devteam: [
      "El equipo depende de asignación externa. Empezad por definir una Definition of Done que todos validen. Cada miembro debe poder trabajar en cualquier tarea del Sprint — la autoorganización requiere responsabilidad colectiva.",
      "Hay autoorganización parcial y silos de especialización. Rotad tareas, implementad pair programming o code reviews para distribuir el conocimiento. Las dependencias externas frecuentes deben mapearse y eliminarse.",
      "Excelente autonomía. Implementad límites de WIP para reducir el multitasking y maximizar el flujo. Medir el cycle time ayuda a identificar cuellos de botella y hacer proyecciones más fiables."
    ],
    transparencia: [
      "El Scrum Board no refleja la realidad. Cada miembro es responsable de actualizarlo en tiempo real. Sin visibilidad compartida el equipo no puede colaborar ni identificar impedimentos antes de que bloqueen el Sprint Goal.",
      "La visibilidad existe pero los impedimentos no se escalan a tiempo. Cread el hábito de levantar impedimentos en el Daily antes de que bloqueen el Sprint. El Scrum Master os ayuda a eliminarlos, pero primero deben ser visibles.",
      "Gran transparencia. Incorporad métricas de flujo (burndown, velocity, cycle time) para hacer retrospectivas basadas en datos y proyecciones más predictibles para los stakeholders."
    ]
  },
  'Scrum Master': {
    tecnico: [
      "Las prácticas técnicas débiles son un impedimento sistémico. Facilita la conversación sobre la DoD incluyendo criterios de calidad técnica. Conecta con el equipo técnico para entender las dependencias e impedimentos estructurales que frenan la velocidad.",
      "Hay prácticas técnicas pero el equipo no las prioriza sistemáticamente. Ayuda a hacer visible la deuda técnica en el backlog y facilita la conversación con el PO para que sea priorizada. Un equipo con deuda técnica no controlada no puede ser predecible.",
      "Buena base técnica. Trabaja con el equipo en adoptar métricas de ingeniería (deployment frequency, lead time for changes) para que las conversaciones de mejora se basen en datos objetivos."
    ],
    cliente: [
      "El equipo está desconectado del impacto de su trabajo. Facilita sesiones de mapeo de valor donde el equipo visualice cómo su trabajo llega al usuario final. Sin esta conexión, el equipo optimiza procesos en lugar de valor.",
      "Hay contacto esporádico con el cliente. Trabaja con el PO para establecer métricas de outcome en el Definition of Done conceptual del Sprint. Cuando el equipo ve el impacto de su trabajo, la motivación y la calidad de las decisiones mejoran.",
      "Excelente orientación al cliente. Facilita la incorporación de feedback de usuario en las Retrospectivas. El aprendizaje sobre el cliente debería informar tanto la mejora del proceso como la estrategia del producto."
    ],
    eventos: [
      "Las ceremonias no tienen el propósito correcto. Facilita sesiones de formación sobre el propósito de cada evento Scrum. El Sprint Planning debe terminar con un Sprint Goal comprometido por todos, no solo con una lista de tareas.",
      "Las ceremonias ocurren pero son superficiales. Mejora la calidad de facilitación: usa técnicas para que el Daily sea del equipo (no dirigido al SM) y que la Retro genere compromisos medibles con dueño.",
      "Buenas ceremonias. Enfócate en que el equipo sea autónomo en la facilitación — tu objetivo es hacer que los eventos fluyan bien sin necesitarte como facilitador permanente."
    ],
    backlog: [
      "El PO y el equipo no colaboran en el backlog. Facilita la relación: organiza las primeras sesiones de refinamiento, ayuda al PO a escribir User Stories con criterios claros y al equipo a estimar con confianza.",
      "El refinamiento ocurre pero podría ser más efectivo. Observa las sesiones e identifica dónde se generan malentendidos. Educa al PO en técnicas de escritura de historias y al equipo en estimación relativa.",
      "Buena gestión del backlog. Apoya al PO en conectar el backlog con métricas de valor y explora con el equipo técnicas de priorización avanzadas como WSJF o Cost of Delay."
    ],
    devteam: [
      "El equipo no se autoorganiza. Crea espacios seguros para que tome decisiones: empieza con que el equipo elija sus propias tareas en el Sprint Planning. Identifica y elimina las dependencias externas que impiden la autonomía.",
      "Hay autoorganización parcial. Mapea las dependencias externas e impedimentos sistémicos que frenan al equipo. Trabajar con la organización para eliminarlos es tu palanca de mayor impacto como SM.",
      "Buen nivel de autoorganización. Trabaja en métricas de equipo (velocity, predictibilidad) y ayúdales a evolucionar la DoD para incrementar la calidad del Increment continuamente."
    ],
    transparencia: [
      "La transparencia es el pilar más urgente. Establece un Scrum Board visible y forma al equipo en la importancia de actualizarlo. Sin artefactos que reflejen la realidad, la inspección y adaptación son imposibles.",
      "Hay visibilidad parcial. Trabaja en que los impedimentos sean visibles antes de que escalen: crea un registro de impedimentos visible y da seguimiento a su resolución — esto genera confianza en el proceso.",
      "Gran transparencia. Evoluciona hacia un dashboard de métricas de flujo que permita conversaciones basadas en datos con stakeholders y decisiones de mejora más informadas en la Retro."
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

function detectPatterns(dimScores) {
  return CROSS_PATTERNS.filter(p =>
    p.dims.every(k => dimScores[k] && dimScores[k].pct < p.maxPct)
  );
}

function getContextNote(dim, pct, tamano, tiempoScrum) {
  if (!tamano && !tiempoScrum) return null;
  if (tiempoScrum === '<6 meses' && pct < 70)
    return 'Equipo nuevo: priorizar cadencia básica y rituales antes de optimizar.';
  if (tiempoScrum === '>18 meses' && pct < 50)
    return 'Más de 18 meses con Scrum en este nivel sugiere impedimentos sistémicos o resistencia estructural que conviene abordar explícitamente.';
  if (tiempoScrum === '6–18 meses' && pct < 40)
    return 'Con 6–18 meses en Scrum, este nivel puede indicar falta de apoyo organizacional o coaching insuficiente.';
  if (tamano === '10+' && dim === 'eventos' && pct < 70)
    return 'Equipo grande: la coordinación a escala requiere estructura explícita en los eventos Scrum.';
  if (tamano === '10+' && dim === 'devteam' && pct < 60)
    return 'Equipo grande: la autoorganización es más compleja; considerar sub-equipos o acuerdos explícitos de trabajo.';
  if (tamano === '1–5' && dim === 'devteam' && pct < 60)
    return 'Equipo pequeño: la cross-funcionalidad es crítica para evitar que una sola persona sea cuello de botella.';
  return null;
}

function getLevel(pct) { return LEVELS.find(l => pct <= l.max) || LEVELS[LEVELS.length - 1]; }

function getRec(dim, pct, role) {
  const idx = pct <= 33 ? 0 : pct <= 66 ? 1 : 2;
  if (role && RECS_ROLE[role] && RECS_ROLE[role][dim]) return RECS_ROLE[role][dim][idx];
  return RECS[dim][idx];
}

// CommonJS exports para tests (no-op en el browser)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SECTIONS, LEVELS, DIMS, RECS, RECS_ROLE, CROSS_PATTERNS, DIM_COLORS, detectPatterns, getContextNote, getLevel, getRec };
}
