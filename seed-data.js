// ─────────────────────────────────────────────────────────────────────────────
// SEED SCRIPT V4 — AssessmentAgile
// Pegar en la consola del navegador mientras estás logueado en admin.html
//
// ¿Qué hace?
//   1. ELIMINA todos los datos del workspace actual (ciclos, equipos,
//      respuestas y planes del ownerId logueado).
//   2. CREA datos nuevos optimizados para screenshots de la guía:
//        · 4 equipos (3 Software + 1 Conocimiento)
//        · 3 ciclos (2 cerrados + 1 activo)
//        · 5-6 respuestas por equipo/ciclo con todos los campos V4
//        · Comentarios reales que activan el badge "Señal oculta"
//        · Health scores para badge de salud
//        · 12 planes de acción con distintos estados
//
// Equipos creados:
//   Alpha  — Software — "En desarrollo" → "Maduro"   (equipo que mejora)
//   Beta   — Software — "Inicial" → "En desarrollo"  (equipo que lucha)
//   Gamma  — Software — "Maduro" → "Avanzado"        (equipo de alto rendimiento)
//   Delta  — Conocimiento — "En desarrollo" → "Maduro" (no-software, últimos 2 ciclos)
// ─────────────────────────────────────────────────────────────────────────────

(async function seed() {
  if (typeof state === 'undefined' || !state.currentUser) {
    console.error('❌ Debes estar logueado en admin.html. state.currentUser =',
      typeof state !== 'undefined' ? state.currentUser : 'state no existe');
    return;
  }

  const ownerId = state.currentUser.uid;
  const NOW     = Date.now();
  const daysAgo = (d) => new Date(NOW - d * 864e5);
  const ts      = (d) => firebase.firestore.Timestamp.fromDate(daysAgo(d));

  // ── Helpers ───────────────────────────────────────────────────────────────

  function getLevelLabel(pct) {
    if (pct <= 40) return 'Inicial';
    if (pct <= 65) return 'En desarrollo';
    if (pct <= 82) return 'Maduro';
    return 'Avanzado';
  }

  // Distribuye `target` puntos entre `numQ` preguntas (0-3 c/u)
  function genAnswers(secId, numQ, target) {
    const safe = Math.max(0, Math.min(numQ * 3, target));
    const ans  = {};
    let rem    = safe;
    for (let qi = 0; qi < numQ; qi++) {
      const left = numQ - qi;
      const maxV = Math.min(3, rem);
      const minV = Math.max(0, rem - (left - 1) * 3);
      const range = maxV - minV;
      const val   = minV + (range > 0 ? Math.floor(Math.random() * (range + 1)) : 0);
      ans[`${secId}_${qi}`] = val;
      rem -= val;
    }
    return ans;
  }

  // Elimina todos los docs de una query (en batches de 450)
  async function deleteQuery(query) {
    const snap = await query.get();
    if (snap.empty) return 0;
    let batch = db.batch(), count = 0, total = 0;
    for (const doc of snap.docs) {
      batch.delete(doc.ref);
      count++;
      total++;
      if (count === 450) {
        await batch.commit();
        batch = db.batch();
        count = 0;
      }
    }
    if (count > 0) await batch.commit();
    return total;
  }

  // ── PASO 1: ELIMINAR DATOS ACTUALES ───────────────────────────────────────

  console.log('🗑  Eliminando datos anteriores del workspace...');

  // Obtener IDs de equipos actuales para poder borrar sus respuestas
  const equiposSnap = await db.collection('equipos').where('ownerId', '==', ownerId).get();
  const oldTeamIds  = equiposSnap.docs.map(d => d.id);

  // Borrar respuestas de cada equipo (en lotes de 10 equipos por query, límite Firestore)
  let totalResp = 0;
  for (let i = 0; i < oldTeamIds.length; i += 10) {
    const chunk = oldTeamIds.slice(i, i + 10);
    totalResp += await deleteQuery(
      db.collection('respuestas').where('equipoId', 'in', chunk)
    );
  }

  // Borrar ciclos, planes y equipos del workspace
  const [nc, np, ne] = await Promise.all([
    deleteQuery(db.collection('ciclos').where('ownerId', '==', ownerId)),
    deleteQuery(db.collection('planes').where('ownerId', '==', ownerId)),
    deleteQuery(db.collection('equipos').where('ownerId', '==', ownerId)),
  ]);

  // Borrar análisis IA si existen
  await deleteQuery(db.collection('analisis_ia').where('ownerId', '==', ownerId));

  console.log(`  ✓ Eliminados: ${ne} equipos · ${nc} ciclos · ${totalResp} respuestas · ${np} planes`);

  // ── PASO 2: CONFIGURAR WORKSPACE ──────────────────────────────────────────

  console.log('\n⚙️  Configurando workspace...');
  await db.collection('workspaces').doc(ownerId).set({
    teamHealthEnabled: true,   // activar preguntas de salud para screenshots
    aiEnabled:         true,
    anonymityMode:     'semi', // rol visible pero nombre oculto
    assessmentCadenceWeeks: 12,
    guidanceText:      '',     // usar texto por defecto
  }, { merge: true });
  console.log('  ✓ teamHealthEnabled, aiEnabled, anonymityMode=semi');

  // ── PASO 3: SECCIONES V4 ─────────────────────────────────────────────────

  // V4: transparencia tiene 4 preguntas (max 12), total máximo 63 pts
  const SECTIONS_META = [
    { id: 'eventos',       numQ: 4, storeKey: 'scoreEventos',       max: 12 },
    { id: 'backlog',       numQ: 3, storeKey: 'scoreBacklog',        max:  9 },
    { id: 'devteam',       numQ: 4, storeKey: 'scoreDevTeam',        max: 12 },
    { id: 'transparencia', numQ: 4, storeKey: 'scoreTransparencia',  max: 12 }, // ← V4
    { id: 'tecnico',       numQ: 3, storeKey: 'scoreTecnico',        max:  9 },
    { id: 'cliente',       numQ: 3, storeKey: 'scoreCliente',        max:  9 },
  ];
  const MAX_TOTAL = 63;

  // ── PASO 4: CICLOS ────────────────────────────────────────────────────────

  console.log('\n📅 Creando ciclos...');
  const CYCLE_DEFS = [
    { nombre: 'Q1 2025 – Ene/Mar', activo: false, offsetDays: 100 },
    { nombre: 'Q2 2025 – Abr/Jun', activo: false, offsetDays:  60 },
    { nombre: 'Q3 2025 – Jul/Sep', activo: true,  offsetDays:  15 },
  ];

  const cycles = [];
  for (const cd of CYCLE_DEFS) {
    const ref = await db.collection('ciclos').add({
      nombre:   cd.nombre,
      activo:   cd.activo,
      ownerId,
      creadoEn: ts(cd.offsetDays),
    });
    cycles.push({ id: ref.id, nombre: cd.nombre, offsetDays: cd.offsetDays });
    console.log(`  ✓ ${cd.nombre}${cd.activo ? ' (activo)' : ''}`);
  }

  // ── PASO 5: PERFILES DE SCORE ─────────────────────────────────────────────
  //
  // Targets por sección para cada equipo en cada ciclo.
  // Los respondentes individuales reciben jitter de ±2 para variabilidad.
  //
  // Alpha  (improving):  51% → 63% → 75%  En desarrollo → En desarrollo → Maduro
  // Beta   (struggling): 25% → 35% → 49%  Inicial → Inicial → En desarrollo
  // Gamma  (advanced):   73% → 84% → 94%  Maduro → Avanzado → Avanzado
  // Delta  (knowledge):  N/A → 49% → 70%  (se une en Q2) En desarrollo → Maduro

  const PROFILES = {
    //                   Q1                              Q2                              Q3
    alpha: [
      { ev: 7, bl: 5, dt: 7, tr: 5, tc: 4, cl: 4 }, // 32/63=51% En desarrollo
      { ev: 9, bl: 6, dt: 8, tr: 7, tc: 5, cl: 5 }, // 40/63=63% En desarrollo
      { ev:10, bl: 7, dt:10, tr: 8, tc: 6, cl: 6 }, // 47/63=75% Maduro
    ],
    beta: [
      { ev: 3, bl: 2, dt: 4, tr: 3, tc: 2, cl: 2 }, // 16/63=25% Inicial
      { ev: 5, bl: 3, dt: 5, tr: 4, tc: 2, cl: 3 }, // 22/63=35% Inicial
      { ev: 7, bl: 5, dt: 6, tr: 6, tc: 4, cl: 3 }, // 31/63=49% En desarrollo
    ],
    gamma: [
      { ev:10, bl: 7, dt: 9, tr: 8, tc: 6, cl: 6 }, // 46/63=73% Maduro
      { ev:11, bl: 8, dt:11, tr: 9, tc: 7, cl: 7 }, // 53/63=84% Avanzado
      { ev:12, bl: 9, dt:12, tr:10, tc: 8, cl: 8 }, // 59/63=94% Avanzado
    ],
    delta: [
      null,                                            // no participa en Q1
      { ev: 6, bl: 5, dt: 6, tr: 5, tc: 5, cl: 4 }, // 31/63=49% En desarrollo
      { ev: 9, bl: 6, dt: 8, tr: 8, tc: 7, cl: 6 }, // 44/63=70% Maduro
    ],
  };

  // ── PASO 6: COMENTARIOS POR EQUIPO/CICLO ─────────────────────────────────
  //
  // Los comentarios se asignan a respondentes específicos (por índice).
  // Alpha Q3 / Ceremonias: score=83% + términos de riesgo → badge "Señal oculta" ⚠
  // Beta  Q3 / Transparencia: score alto + "nadie los escala"
  // Gamma Q3: comentarios positivos
  // Delta Q3: comentarios de equipo de conocimiento

  const COMMENTS = {
    alpha: {
      1: { // Q2
        0: { eventos: 'El Sprint Goal empieza a ser más claro aunque las retros todavía no generan compromisos reales.' },
        2: { backlog:  'El backlog está más ordenado pero el Product Goal no es conocido por todos.' },
      },
      2: { // Q3
        // respondente 0 (PO): comentario con términos de riesgo en eventos (→ "Señal oculta")
        0: { eventos: 'Las ceremonias han mejorado bastante este trimestre. Aun así, las retros siguen siendo un teatro: nadie escribe las acciones y tampoco las seguimos entre sprint y sprint.' },
        1: { devteam: 'La autoorganización ha mejorado mucho. Ya casi no necesitamos que alguien nos asigne tareas.' },
        3: { transparencia: 'Los impedimentos se escalan mejor que antes aunque algunos quedan sin dueño durante días.' },
        4: { cliente: 'Tuvimos dos sesiones de validación con usuarios este trimestre. Muy valioso.' },
      },
    },
    beta: {
      2: { // Q3
        0: { eventos: 'Hacemos las reuniones porque toca. El Sprint Goal existe en el papel pero nadie lo usa para tomar decisiones.' },
        2: { transparencia: 'Los impedimentos llevan semanas sin resolverse. Nadie los escala realmente.' },
        3: { devteam: 'Hay demasiadas dependencias externas. No podemos terminar nada sin esperar a otro equipo.' },
      },
    },
    gamma: {
      2: { // Q3
        0: { eventos: 'Las ceremonias funcionan de forma excelente. El Sprint Goal guía cada decisión del equipo.' },
        1: { tecnico: 'Nuestro pipeline de CI/CD es sólido. La cobertura de tests nos da plena confianza para refactorizar.' },
        4: { cliente: 'Hacemos discovery continuo con usuarios. La métrica de activación mejoró un 18% este trimestre.' },
      },
    },
    delta: {
      1: { // Q2
        0: { tecnico: 'Las revisiones entre pares empiezan a ser parte del proceso aunque todavía hay inconsistencias.' },
      },
      2: { // Q3
        0: { tecnico: 'Las revisiones entre pares han mejorado mucho la calidad de los documentos. Ya es un hábito del equipo.' },
        2: { cliente: 'Tuvimos dos sesiones de co-diseño con usuarios internos. El feedback fue muy útil para priorizar.' },
        3: { transparencia: 'Los impedimentos se gestionan bien. El SM es muy proactivo escalándolos.' },
      },
    },
  };

  // ── PASO 7: HEALTH ANSWERS ────────────────────────────────────────────────
  //
  // 3 preguntas (0-3 c/u), max 9 pts. Score = sum/9 * 100
  // Alpha Q3 ~65% (Media) · Beta Q3 ~28% (Baja) · Gamma Q3 ~85% (Alta) · Delta Q3 ~75% (Alta)

  const HEALTH_BY_TEAM_CYCLE = {
    // [teamKey][cycleIdx] = { h0, h1, h2 } — promedio aproximado por equipo
    alpha: { 2: { h0: 2, h1: 2, h2: 2 } },   // 6/9=67% → Media (con jitter dará ~65%)
    beta:  { 2: { h0: 1, h1: 1, h2: 0 } },   // 2/9=22% → Baja
    gamma: { 2: { h0: 3, h1: 3, h2: 2 } },   // 8/9=89% → Alta
    delta: { 2: { h0: 2, h1: 3, h2: 2 } },   // 7/9=78% → Alta
  };

  // ── PASO 8: DEFINICIÓN DE EQUIPOS Y RESPONDENTES ─────────────────────────

  const TEAM_DEFS = [
    {
      key:         'alpha',
      nombre:      'Equipo Alpha',
      descripcion: 'Producto digital · Plataforma web · Squad de 6',
      category:    'Software',
      teamType:    'software',
      perfil:      PROFILES.alpha,
      ciclosIdx:   [0, 1, 2], // participa en los 3 ciclos
      respondents: [
        { nombre: 'María García',    rol: 'Product Owner', teamAge: '>18m', teamSize: '6-9',  dedicatedPO: 'sí', workMode: 'híbrido'    },
        { nombre: 'Carlos Ramírez',  rol: 'Dev Team',      teamAge: '>18m', teamSize: '6-9',  dedicatedPO: 'sí', workMode: 'híbrido'    },
        { nombre: 'Ana Pérez',       rol: 'Dev Team',      teamAge: '>18m', teamSize: '6-9',  dedicatedPO: 'sí', workMode: 'híbrido'    },
        { nombre: 'Luis Mendoza',    rol: 'Scrum Master',  teamAge: '>18m', teamSize: '6-9',  dedicatedPO: 'sí', workMode: 'híbrido'    },
        { nombre: 'Sofía Vargas',    rol: 'Dev Team',      teamAge: '>18m', teamSize: '6-9',  dedicatedPO: 'sí', workMode: 'híbrido'    },
        { nombre: 'Pedro Alvarado',  rol: 'Dev Team',      teamAge: '>18m', teamSize: '6-9',  dedicatedPO: 'sí', workMode: 'híbrido'    },
      ],
    },
    {
      key:         'beta',
      nombre:      'Equipo Beta',
      descripcion: 'Backend · Microservicios · Squad de 5',
      category:    'Software',
      teamType:    'software',
      perfil:      PROFILES.beta,
      ciclosIdx:   [0, 1, 2],
      respondents: [
        { nombre: 'Roberto Silva',   rol: 'Product Owner', teamAge: '6-18m', teamSize: '6-9', dedicatedPO: 'no', workMode: 'remoto'     },
        { nombre: 'Daniela Torres',  rol: 'Dev Team',      teamAge: '6-18m', teamSize: '6-9', dedicatedPO: 'no', workMode: 'remoto'     },
        { nombre: 'Miguel Ángel',    rol: 'Dev Team',      teamAge: '<6m',   teamSize: '6-9', dedicatedPO: 'no', workMode: 'remoto'     },
        { nombre: 'Carmen López',    rol: 'Scrum Master',  teamAge: '6-18m', teamSize: '6-9', dedicatedPO: 'no', workMode: 'remoto'     },
        { nombre: 'José Morales',    rol: 'Dev Team',      teamAge: '<6m',   teamSize: '6-9', dedicatedPO: 'no', workMode: 'remoto'     },
      ],
    },
    {
      key:         'gamma',
      nombre:      'Equipo Gamma',
      descripcion: 'Plataforma de datos e IA · Squad de 7',
      category:    'Software',
      teamType:    'software',
      perfil:      PROFILES.gamma,
      ciclosIdx:   [0, 1, 2],
      respondents: [
        { nombre: 'Alejandro Ríos',  rol: 'Product Owner', teamAge: '>18m', teamSize: '6-9',  dedicatedPO: 'sí', workMode: 'presencial' },
        { nombre: 'Isabella Chen',   rol: 'Dev Team',      teamAge: '>18m', teamSize: '6-9',  dedicatedPO: 'sí', workMode: 'presencial' },
        { nombre: 'Fernando Vega',   rol: 'Dev Team',      teamAge: '>18m', teamSize: '6-9',  dedicatedPO: 'sí', workMode: 'presencial' },
        { nombre: 'Natalia Ruiz',    rol: 'Scrum Master',  teamAge: '>18m', teamSize: '6-9',  dedicatedPO: 'sí', workMode: 'presencial' },
        { nombre: 'Eduardo Kim',     rol: 'Dev Team',      teamAge: '>18m', teamSize: '6-9',  dedicatedPO: 'sí', workMode: 'presencial' },
        { nombre: 'Valentina Moreno',rol: 'Dev Team',      teamAge: '>18m', teamSize: '6-9',  dedicatedPO: 'sí', workMode: 'presencial' },
        { nombre: 'Mateo Castro',    rol: 'Dev Team',      teamAge: '6-18m',teamSize: '6-9',  dedicatedPO: 'sí', workMode: 'presencial' },
      ],
    },
    {
      key:         'delta',
      nombre:      'Equipo Delta',
      descripcion: 'Marketing digital · Contenidos y CRM',
      category:    'Conocimiento',
      teamType:    'knowledge',
      perfil:      PROFILES.delta,
      ciclosIdx:   [1, 2], // se une en Q2
      respondents: [
        { nombre: 'Patricia Soto',   rol: 'Product Owner', teamAge: '6-18m', teamSize: '1-5', dedicatedPO: 'no', workMode: 'híbrido'   },
        { nombre: 'Andrés Blanco',   rol: 'Dev Team',      teamAge: '6-18m', teamSize: '1-5', dedicatedPO: 'no', workMode: 'híbrido'   },
        { nombre: 'Camila Reyes',    rol: 'Dev Team',      teamAge: '<6m',   teamSize: '1-5', dedicatedPO: 'no', workMode: 'híbrido'   },
        { nombre: 'Rodrigo Fuentes', rol: 'Scrum Master',  teamAge: '6-18m', teamSize: '1-5', dedicatedPO: 'no', workMode: 'híbrido'   },
        { nombre: 'Laura Espinoza',  rol: 'Dev Team',      teamAge: '<6m',   teamSize: '1-5', dedicatedPO: 'no', workMode: 'híbrido'   },
      ],
    },
  ];

  // ── PASO 9: CREAR EQUIPOS Y RESPUESTAS ───────────────────────────────────

  console.log('\n👥 Creando equipos y respuestas...');
  const teamIds = {}; // teamKey → docId

  for (const td of TEAM_DEFS) {
    // Crear equipo
    const tRef = await db.collection('equipos').add({
      nombre:      td.nombre,
      descripcion: td.descripcion,
      activo:      true,
      ownerId,
      category:    td.category,
      creadoEn:    ts(120),
      notas:       {},
    });
    teamIds[td.key] = tRef.id;
    console.log(`\n  Equipo: ${td.nombre} [${td.category}] (${tRef.id})`);

    // Iterar sobre los ciclos en que participa este equipo
    for (const ci of td.ciclosIdx) {
      const cycle    = cycles[ci];
      const targets  = td.perfil[ci];
      if (!targets) continue; // ciclo en que no participa

      const teamComments    = (COMMENTS[td.key] || {})[ci] || {};
      const healthBase      = (HEALTH_BY_TEAM_CYCLE[td.key] || {})[ci] || null;
      const respondents     = td.respondents;
      const baseOffsetDays  = cycle.offsetDays;

      const batch = db.batch();

      for (let r = 0; r < respondents.length; r++) {
        const resp      = respondents[r];
        const jitter    = () => Math.floor(Math.random() * 5) - 2; // ±2

        // Generar respuestas y scores por sección
        let allAnswers = {};
        const scoreFields = {};
        let totalRaw = 0;

        const KEY_MAP = { eventos: 'ev', backlog: 'bl', devteam: 'dt', transparencia: 'tr', tecnico: 'tc', cliente: 'cl' };

        for (const sm of SECTIONS_META) {
          const t = targets[KEY_MAP[sm.id]];
          const adjusted  = Math.max(0, Math.min(sm.max, t + jitter()));
          const sAns      = genAnswers(sm.id, sm.numQ, adjusted);
          Object.assign(allAnswers, sAns);
          const rawScore  = Object.values(sAns).reduce((a, b) => a + b, 0);
          scoreFields[sm.storeKey] = rawScore;
          totalRaw += rawScore;
        }

        const pct   = Math.round(totalRaw / MAX_TOTAL * 100);
        const nivel = getLevelLabel(pct);

        // Health answers (solo si hay configuración para este ciclo)
        let teamHealthScore = null;
        let healthAnswers   = {};
        if (healthBase) {
          const hj  = () => Math.max(0, Math.min(3, Math.floor(Math.random() * 2)));
          const h0  = Math.max(0, Math.min(3, healthBase.h0 + (Math.random() > 0.5 ? 0 : hj())));
          const h1  = Math.max(0, Math.min(3, healthBase.h1 + (Math.random() > 0.5 ? 0 : hj())));
          const h2  = Math.max(0, Math.min(3, healthBase.h2 + (Math.random() > 0.5 ? 0 : hj())));
          healthAnswers    = { health_0: h0, health_1: h1, health_2: h2 };
          teamHealthScore  = Math.round((h0 + h1 + h2) / 9 * 100);
        }

        // Comentarios del respondente (si aplica para este índice)
        const comments = teamComments[r] || {};

        const fechaResp = daysAgo(baseOffsetDays - r * 0.5);
        const secsSinceStart = Math.floor(500 + Math.random() * 700); // 8-20 min

        const rRef = db.collection('respuestas').doc();
        batch.set(rRef, {
          equipoId:     tRef.id,
          equipoNombre: td.nombre,
          participante: resp.nombre,
          rol:          resp.rol,
          ciclo:        cycle.nombre,
          teamAge:      resp.teamAge,
          teamSize:     resp.teamSize,
          dedicatedPO:  resp.dedicatedPO,
          workMode:     resp.workMode,
          teamType:     td.teamType,
          completionSeconds: secsSinceStart,
          flaggedFast:  false,
          ...scoreFields,
          scoreTotalPct: pct,
          nivel,
          answers:      allAnswers,
          comments,
          customAnswers: {},
          ...(teamHealthScore !== null ? { teamHealthScore, healthAnswers } : {}),
          fecha: firebase.firestore.Timestamp.fromDate(fechaResp),
        });
      }

      await batch.commit();
      const pctApprox = Math.round(
        (targets.ev + targets.bl + targets.dt + targets.tr + targets.tc + targets.cl) / MAX_TOTAL * 100
      );
      console.log(`    Ciclo ${ci + 1} (${cycle.nombre}): ${respondents.length} resp · ~${pctApprox}% ${getLevelLabel(pctApprox)}`);
    }
  }

  // ── PASO 10: PLANES DE ACCIÓN ─────────────────────────────────────────────

  console.log('\n📋 Creando planes de acción...');
  const lastCiclo = cycles[2].nombre; // Q3 2025 (activo)

  const PLAN_DEFS = [
    // Alpha (mejorando — ceremoniasa y técnico como foco)
    { key: 'alpha', planes: [
      { iniciativa: 'Reforzar el seguimiento de compromisos en la Retrospectiva', responsable: 'Scrum Master', estado: 'en-curso',   dimension: 'eventos', fechaObjetivo: '2025-10-31' },
      { iniciativa: 'Implementar CI/CD pipeline con deploy automático',           responsable: 'Tech Lead',    estado: 'en-curso',   dimension: 'tecnico', fechaObjetivo: '2025-11-30' },
      { iniciativa: 'Definir métricas de valor por funcionalidad (OKRs)',          responsable: 'Product Owner',estado: 'pendiente', dimension: 'cliente', fechaObjetivo: '2025-12-15' },
    ]},
    // Beta (en crisis — base de Scrum por construir)
    { key: 'beta', planes: [
      { iniciativa: 'Crear y acordar Definition of Done con el equipo',           responsable: 'Scrum Master',  estado: 'en-curso',   dimension: 'devteam', fechaObjetivo: '2025-10-15', updatedByTeam: true },
      { iniciativa: 'Ordenar el Product Backlog por valor de negocio',             responsable: 'Product Owner', estado: 'pendiente',  dimension: 'backlog', fechaObjetivo: '2025-10-31' },
      { iniciativa: 'Capacitación práctica en Sprint Goal y por qué importa',      responsable: 'Scrum Master',  estado: 'completado', dimension: 'eventos', fechaObjetivo: '2025-09-30' },
    ]},
    // Gamma (avanzado — optimización continua)
    { key: 'gamma', planes: [
      { iniciativa: 'Expandir cobertura de tests de integración al 90%',          responsable: 'Dev Team',      estado: 'completado', dimension: 'tecnico', fechaObjetivo: '2025-09-30' },
      { iniciativa: 'Implementar programa de Continuous Discovery con usuarios',   responsable: 'Product Owner', estado: 'en-curso',   dimension: 'cliente', fechaObjetivo: '2025-12-31' },
      { iniciativa: 'Adoptar Team Topologies para reducir dependencias externas',  responsable: 'Scrum Master',  estado: 'pendiente',  dimension: 'devteam', fechaObjetivo: '2026-01-31' },
    ]},
    // Delta (conocimiento — mejoras de proceso y calidad)
    { key: 'delta', planes: [
      { iniciativa: 'Establecer criterios de calidad para todos los entregables', responsable: 'Product Owner', estado: 'en-curso',   dimension: 'tecnico', fechaObjetivo: '2025-10-31' },
      { iniciativa: 'Sesión trimestral de co-diseño con clientes internos',       responsable: 'Scrum Master',  estado: 'pendiente',  dimension: 'cliente', fechaObjetivo: '2025-12-15' },
      { iniciativa: 'Reducir retrabajo documentando decisiones en el backlog',    responsable: 'Dev Team',      estado: 'pendiente',  dimension: 'backlog', fechaObjetivo: '2025-11-30' },
    ]},
  ];

  const planBatch = db.batch();
  let totalPlanes = 0;
  for (const pg of PLAN_DEFS) {
    const equipoId = teamIds[pg.key];
    for (const p of pg.planes) {
      const pRef = db.collection('planes').doc();
      planBatch.set(pRef, {
        equipoId,
        equipoNombre:  TEAM_DEFS.find(t => t.key === pg.key).nombre,
        ciclo:         lastCiclo,
        iniciativa:    p.iniciativa,
        responsable:   p.responsable,
        fechaObjetivo: p.fechaObjetivo,
        estado:        p.estado,
        dimension:     p.dimension,
        ownerId,
        updatedByTeam:    p.updatedByTeam || false,
        updatedByTeamAt:  p.updatedByTeam ? ts(2) : null,
        portalToken:   null,
        fechaCreacion: ts(20),
      });
      totalPlanes++;
    }
  }
  await planBatch.commit();
  console.log(`  ✓ ${totalPlanes} planes creados`);

  // ── RESUMEN ───────────────────────────────────────────────────────────────

  console.log('\n✅ Seed V4 completado!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('EQUIPOS CREADOS:');
  console.log('  Alpha  [Software]     · 3 ciclos · Q1→Q3 · "En desarrollo" → "Maduro"');
  console.log('  Beta   [Software]     · 3 ciclos · Q1→Q3 · "Inicial" → "En desarrollo"');
  console.log('  Gamma  [Software]     · 3 ciclos · Q1→Q3 · "Maduro" → "Avanzado"');
  console.log('  Delta  [Conocimiento] · 2 ciclos · Q2→Q3 · "En desarrollo" → "Maduro"');
  console.log('');
  console.log('FEATURES VISIBLES EN SCREENSHOTS:');
  console.log('  ⚠  Badge "Señal oculta"  → Alpha / Ceremonias (score 83%+ + comentario con "teatro")');
  console.log('  📊 Benchmark segmentado  → 3 equipos Software (Alpha, Beta, Gamma)');
  console.log('  🧠 Badge No-software     → Delta (teamType=knowledge)');
  console.log('  ❤  Badge salud equipo   → Alpha=Media · Beta=Baja · Gamma=Alta · Delta=Alta');
  console.log('  ↗  Momentum             → Alpha y Delta (mejorando)');
  console.log('  📈 Gráfico líneas        → ≥3 ciclos disponibles para Alpha, Beta y Gamma');
  console.log('  🔄 Actualizado x equipo  → Beta / Plan "Definition of Done"');
  console.log('  👥 Panel participación   → PO + Dev Team(s) + SM en cada equipo');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Recarga la página (F5) para ver los datos.');
})();
