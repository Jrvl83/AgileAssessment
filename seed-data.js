// ─────────────────────────────────────────────────────────────────────────────
// SEED SCRIPT V5 — AssessmentAgile
// Pegar en la consola del navegador mientras estás logueado en admin.html
//
// ¿Qué hace?
//   1. ELIMINA todos los datos del workspace actual.
//   2. CREA datos nuevos con 4 equipos, cada uno con 1 SM + 1 PO + Dev Team:
//        · Fénix   — 3 devs  — Software     — "En desarrollo" → "Maduro"
//        · Orión   — 5 devs  — Software     — "Maduro" (estable y maduro)
//        · Titán   — 8 devs  — Software     — "Inicial" → "En desarrollo" (equipo grande que lucha)
//        · Nova    — 7 devs  — Conocimiento — se une en Q2, mejora a "Maduro"
//        · 3 ciclos (Q1 cerrado, Q2 cerrado, Q3 activo)
//        · Health scores, comentarios y planes de acción por equipo
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

  const equiposSnap = await db.collection('equipos').where('ownerId', '==', ownerId).get();
  const oldTeamIds  = equiposSnap.docs.map(d => d.id);

  let totalResp = 0;
  for (let i = 0; i < oldTeamIds.length; i += 10) {
    const chunk = oldTeamIds.slice(i, i + 10);
    totalResp += await deleteQuery(
      db.collection('respuestas').where('equipoId', 'in', chunk)
    );
  }

  const [nc, np, ne] = await Promise.all([
    deleteQuery(db.collection('ciclos').where('ownerId', '==', ownerId)),
    deleteQuery(db.collection('planes').where('ownerId', '==', ownerId)),
    deleteQuery(db.collection('equipos').where('ownerId', '==', ownerId)),
  ]);

  await deleteQuery(db.collection('analisis_ia').where('ownerId', '==', ownerId));

  console.log(`  ✓ Eliminados: ${ne} equipos · ${nc} ciclos · ${totalResp} respuestas · ${np} planes`);

  // ── PASO 2: CONFIGURAR WORKSPACE ──────────────────────────────────────────

  console.log('\n⚙️  Configurando workspace...');
  await db.collection('workspaces').doc(ownerId).set({
    teamHealthEnabled:       true,
    aiEnabled:               true,
    anonymityMode:           'semi',
    assessmentCadenceWeeks:  12,
    guidanceText:            '',
  }, { merge: true });
  console.log('  ✓ teamHealthEnabled, aiEnabled, anonymityMode=semi');

  // ── PASO 3: SECCIONES V4 ─────────────────────────────────────────────────

  const SECTIONS_META = [
    { id: 'eventos',       numQ: 4, storeKey: 'scoreEventos',       max: 12 },
    { id: 'backlog',       numQ: 3, storeKey: 'scoreBacklog',        max:  9 },
    { id: 'devteam',       numQ: 4, storeKey: 'scoreDevTeam',        max: 12 },
    { id: 'transparencia', numQ: 4, storeKey: 'scoreTransparencia',  max: 12 },
    { id: 'tecnico',       numQ: 3, storeKey: 'scoreTecnico',        max:  9 },
    { id: 'cliente',       numQ: 3, storeKey: 'scoreCliente',        max:  9 },
  ];
  const MAX_TOTAL = 63;

  // ── PASO 4: CICLOS ────────────────────────────────────────────────────────

  console.log('\n📅 Creando ciclos...');
  const CYCLE_DEFS = [
    { nombre: 'Q1 2025 – Ene/Mar', activo: false, offsetDays: 100 },
    { nombre: 'Q2 2025 – Abr/Jun', activo: false, offsetDays:  55 },
    { nombre: 'Q3 2025 – Jul/Sep', activo: true,  offsetDays:  10 },
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
  // Targets por sección (ev, bl, dt, tr, tc, cl) para cada equipo/ciclo.
  // Respondentes reciben jitter de ±2 para variabilidad realista.
  //
  // Fénix   (3 devs)  : 45% → 60% → 71%  En desarrollo → En desarrollo → Maduro
  // Orión   (5 devs)  : 70% → 76% → 81%  Maduro → Maduro → Maduro
  // Titán   (8 devs)  : 32% → 40% → 52%  Inicial → En desarrollo → En desarrollo
  // Nova    (7 devs)  : N/A → 55% → 73%  — (se une Q2) En desarrollo → Maduro

  const PROFILES = {
    //                    Q1                               Q2                               Q3
    fenix: [
      { ev: 7, bl: 5, dt: 6, tr: 5, tc: 4, cl: 1 }, // 28/63=44%  En desarrollo
      { ev: 9, bl: 6, dt: 8, tr: 7, tc: 5, cl: 3 }, // 38/63=60%  En desarrollo
      { ev:10, bl: 7, dt: 9, tr: 8, tc: 6, cl: 5 }, // 45/63=71%  Maduro
    ],
    orion: [
      { ev:10, bl: 7, dt:10, tr: 7, tc: 6, cl: 4 }, // 44/63=70%  Maduro
      { ev:11, bl: 7, dt:10, tr: 8, tc: 7, cl: 5 }, // 48/63=76%  Maduro
      { ev:11, bl: 8, dt:11, tr: 9, tc: 7, cl: 5 }, // 51/63=81%  Maduro
    ],
    titan: [
      { ev: 4, bl: 3, dt: 5, tr: 4, tc: 2, cl: 2 }, // 20/63=32%  Inicial
      { ev: 6, bl: 4, dt: 6, tr: 5, tc: 3, cl: 1 }, // 25/63=40%  En desarrollo
      { ev: 8, bl: 5, dt: 7, tr: 6, tc: 4, cl: 3 }, // 33/63=52%  En desarrollo
    ],
    nova: [
      null,                                            // no participa en Q1
      { ev: 7, bl: 6, dt: 7, tr: 6, tc: 5, cl: 4 }, // 35/63=55%  En desarrollo
      { ev: 9, bl: 7, dt: 9, tr: 8, tc: 6, cl: 7 }, // 46/63=73%  Maduro
    ],
  };

  // ── PASO 6: COMENTARIOS ───────────────────────────────────────────────────
  //
  // Índice de respondente: 0=SM, 1=PO, 2..N=Dev Team
  // Fénix Q3 / Ceremonias (SM): score alto + términos de riesgo → "Señal oculta"
  // Titán Q3 / Dev Team (PO):   señala problemas de coordinación del equipo grande

  const COMMENTS = {
    fenix: {
      1: { // Q2
        1: { backlog: 'El backlog empieza a tomar forma, pero el Product Goal todavía no es conocido por todos los devs.' },
        2: { eventos: 'Las retrospectivas mejoran. Empezamos a llevar un registro de compromisos.' },
      },
      2: { // Q3
        // SM (índice 0): ceremonias con "señal oculta" — score alto + riesgo en comentario
        0: { eventos: 'Las ceremonias están bien estructuradas este sprint. Sin embargo, las retros siguen siendo un teatro: acordamos acciones pero nadie las sigue y en el próximo sprint nadie recuerda qué comprometimos.' },
        1: { backlog:      'El product goal ya es más claro. El backlog está mejor priorizado aunque hay muchos items sin criterios de aceptación.' },
        2: { devteam:      'El equipo está encontrando su ritmo. La autoorganización mejoró notablemente este trimestre.' },
        3: { transparencia:'Los impedimentos ya se escalan en el momento. El tablero siempre está actualizado.' },
      },
    },
    orion: {
      1: { // Q2
        0: { eventos: 'Las ceremonias fluyen de forma natural. El Sprint Goal guía cada decisión del equipo.' },
        3: { tecnico: 'Nuestro pipeline de CI/CD es sólido. Hacemos deploy varias veces por semana sin fricción.' },
      },
      2: { // Q3
        0: { eventos:      'Sprint Goal claro y usado activamente. Las retros generan mejoras reales cada ciclo.' },
        1: { cliente:      'Dos sesiones de validación con usuarios este trimestre. El NPS del producto subió 12 puntos.' },
        4: { tecnico:      'La cobertura de tests alcanzó el 85%. El equipo refactoriza con confianza.' },
        5: { transparencia:'El tablero refleja exactamente el estado real. Cero sorpresas en las demos.' },
      },
    },
    titan: {
      1: { // Q2
        1: { devteam: 'Con 8 devs es muy difícil coordinarse. Las dependencias entre subgrupos bloquean constantemente el flujo.' },
        4: { eventos: 'El Daily tarda 40 minutos. Hay demasiada gente para que sea útil.' },
      },
      2: { // Q3
        // PO (índice 1): señala problemas del equipo grande
        1: { devteam: 'El equipo es demasiado grande. Los impedimentos se pierden entre subgrupos y nadie los escala realmente. Necesitamos dividir o cambiar la estructura.' },
        0: { eventos:      'Hemos reducido el Daily a 25 minutos usando un facilitador rotativo. Es una mejora pero aún hay ruido.' },
        3: { backlog:      'El refinamiento avanza. Los criterios de aceptación son más claros aunque aún hay trabajo por hacer.' },
        6: { transparencia:'Los impedimentos se visibilizan mejor pero la resolución sigue siendo lenta.' },
        8: { cliente:      'Pudimos hacer una sesión de validación con usuarios finales. El feedback fue muy directo.' },
      },
    },
    nova: {
      1: { // Q2
        0: { tecnico: 'Las revisiones entre pares empiezan a ser parte del proceso. Todavía hay inconsistencias en los entregables.' },
        2: { cliente: 'Hicimos la primera sesión de co-diseño con usuarios internos. Muy útil para priorizar.' },
      },
      2: { // Q3
        0: { eventos:      'Las ceremonias adaptadas a equipo de conocimiento funcionan bien. Los sprint reviews generan conversaciones de valor.' },
        1: { backlog:      'El product goal está claro. El backlog de conocimiento está bien priorizado por impacto.' },
        4: { tecnico:      'Las revisiones entre pares ya son un hábito del equipo. La calidad de los entregables mejoró visiblemente.' },
        6: { transparencia:'El SM es muy proactivo escalando impedimentos. Casi ninguno dura más de 2 días sin resolverse.' },
      },
    },
  };

  // ── PASO 7: HEALTH ANSWERS ────────────────────────────────────────────────
  //
  // Fénix Q3 ~60% · Orión Q3 ~85% · Titán Q3 ~30% · Nova Q3 ~72%

  const HEALTH_BY_TEAM_CYCLE = {
    fenix: { 2: { h0: 2, h1: 2, h2: 1 } },   // 5/9 ≈ 56% → Media
    orion: { 2: { h0: 3, h1: 3, h2: 2 } },   // 8/9 ≈ 89% → Alta
    titan: { 2: { h0: 1, h1: 1, h2: 0 } },   // 2/9 ≈ 22% → Baja
    nova:  { 2: { h0: 2, h1: 2, h2: 2 } },   // 6/9 ≈ 67% → Media-Alta
  };

  // ── PASO 8: DEFINICIÓN DE EQUIPOS ────────────────────────────────────────
  //
  // Orden respondentes: siempre SM (índice 0), PO (índice 1), luego Dev Team.

  const TEAM_DEFS = [
    {
      key:         'fenix',
      nombre:      'Equipo Fénix',
      descripcion: 'Producto SaaS B2B · Frontend y API · 3 devs',
      category:    'Software',
      teamType:    'software',
      perfil:      PROFILES.fenix,
      ciclosIdx:   [0, 1, 2],
      respondents: [
        { nombre: 'David Morales',    rol: 'Scrum Master',  teamAge: '6-18m', teamSize: '1-5',  dedicatedPO: 'sí', workMode: 'remoto'    },
        { nombre: 'Laura Jiménez',    rol: 'Product Owner', teamAge: '6-18m', teamSize: '1-5',  dedicatedPO: 'sí', workMode: 'remoto'    },
        { nombre: 'Ricardo Torres',   rol: 'Dev Team',      teamAge: '6-18m', teamSize: '1-5',  dedicatedPO: 'sí', workMode: 'remoto'    },
        { nombre: 'Paola Méndez',     rol: 'Dev Team',      teamAge: '<6m',   teamSize: '1-5',  dedicatedPO: 'sí', workMode: 'remoto'    },
        { nombre: 'Sebastián Vargas', rol: 'Dev Team',      teamAge: '<6m',   teamSize: '1-5',  dedicatedPO: 'sí', workMode: 'remoto'    },
      ],
    },
    {
      key:         'orion',
      nombre:      'Equipo Orión',
      descripcion: 'Plataforma de pagos · Backend y datos · 5 devs',
      category:    'Software',
      teamType:    'software',
      perfil:      PROFILES.orion,
      ciclosIdx:   [0, 1, 2],
      respondents: [
        { nombre: 'Andrea Sánchez',  rol: 'Scrum Master',  teamAge: '>18m', teamSize: '6-9',  dedicatedPO: 'sí', workMode: 'presencial' },
        { nombre: 'Marco Rodríguez', rol: 'Product Owner', teamAge: '>18m', teamSize: '6-9',  dedicatedPO: 'sí', workMode: 'presencial' },
        { nombre: 'Elena Castillo',  rol: 'Dev Team',      teamAge: '>18m', teamSize: '6-9',  dedicatedPO: 'sí', workMode: 'presencial' },
        { nombre: 'Felipe Guzmán',   rol: 'Dev Team',      teamAge: '>18m', teamSize: '6-9',  dedicatedPO: 'sí', workMode: 'presencial' },
        { nombre: 'Gabriela López',  rol: 'Dev Team',      teamAge: '6-18m',teamSize: '6-9',  dedicatedPO: 'sí', workMode: 'presencial' },
        { nombre: 'Héctor Núñez',    rol: 'Dev Team',      teamAge: '6-18m',teamSize: '6-9',  dedicatedPO: 'sí', workMode: 'presencial' },
        { nombre: 'Irene Palacios',  rol: 'Dev Team',      teamAge: '6-18m',teamSize: '6-9',  dedicatedPO: 'sí', workMode: 'presencial' },
      ],
    },
    {
      key:         'titan',
      nombre:      'Equipo Titán',
      descripcion: 'Core bancario · Microservicios · 8 devs',
      category:    'Software',
      teamType:    'software',
      perfil:      PROFILES.titan,
      ciclosIdx:   [0, 1, 2],
      respondents: [
        { nombre: 'Jorge Ramírez',    rol: 'Scrum Master',  teamAge: '6-18m', teamSize: '10+', dedicatedPO: 'no', workMode: 'híbrido'   },
        { nombre: 'Claudia Herrera',  rol: 'Product Owner', teamAge: '>18m',  teamSize: '10+', dedicatedPO: 'no', workMode: 'híbrido'   },
        { nombre: 'Andrés Vega',      rol: 'Dev Team',      teamAge: '>18m',  teamSize: '10+', dedicatedPO: 'no', workMode: 'híbrido'   },
        { nombre: 'Beatriz Flores',   rol: 'Dev Team',      teamAge: '6-18m', teamSize: '10+', dedicatedPO: 'no', workMode: 'híbrido'   },
        { nombre: 'César Mendoza',    rol: 'Dev Team',      teamAge: '6-18m', teamSize: '10+', dedicatedPO: 'no', workMode: 'híbrido'   },
        { nombre: 'Diana Torres',     rol: 'Dev Team',      teamAge: '<6m',   teamSize: '10+', dedicatedPO: 'no', workMode: 'híbrido'   },
        { nombre: 'Ernesto Salinas',  rol: 'Dev Team',      teamAge: '<6m',   teamSize: '10+', dedicatedPO: 'no', workMode: 'híbrido'   },
        { nombre: 'Fernanda Cruz',    rol: 'Dev Team',      teamAge: '<6m',   teamSize: '10+', dedicatedPO: 'no', workMode: 'híbrido'   },
        { nombre: 'Gabriel Moreno',   rol: 'Dev Team',      teamAge: '6-18m', teamSize: '10+', dedicatedPO: 'no', workMode: 'híbrido'   },
        { nombre: 'Hilda Reyes',      rol: 'Dev Team',      teamAge: '<6m',   teamSize: '10+', dedicatedPO: 'no', workMode: 'híbrido'   },
      ],
    },
    {
      key:         'nova',
      nombre:      'Equipo Nova',
      descripcion: 'Gestión del conocimiento · Procesos y mejora continua · 7 devs',
      category:    'Conocimiento',
      teamType:    'knowledge',
      perfil:      PROFILES.nova,
      ciclosIdx:   [1, 2], // se une en Q2
      respondents: [
        { nombre: 'Patricia Ruiz',    rol: 'Scrum Master',  teamAge: '6-18m', teamSize: '6-9',  dedicatedPO: 'no', workMode: 'híbrido'   },
        { nombre: 'Tomás Guerrero',   rol: 'Product Owner', teamAge: '6-18m', teamSize: '6-9',  dedicatedPO: 'no', workMode: 'híbrido'   },
        { nombre: 'Natalia Serrano',  rol: 'Dev Team',      teamAge: '6-18m', teamSize: '6-9',  dedicatedPO: 'no', workMode: 'híbrido'   },
        { nombre: 'Pablo Delgado',    rol: 'Dev Team',      teamAge: '<6m',   teamSize: '6-9',  dedicatedPO: 'no', workMode: 'híbrido'   },
        { nombre: 'Rocío Aguilar',    rol: 'Dev Team',      teamAge: '6-18m', teamSize: '6-9',  dedicatedPO: 'no', workMode: 'híbrido'   },
        { nombre: 'Samuel Ortega',    rol: 'Dev Team',      teamAge: '<6m',   teamSize: '6-9',  dedicatedPO: 'no', workMode: 'híbrido'   },
        { nombre: 'Teresa Fuentes',   rol: 'Dev Team',      teamAge: '<6m',   teamSize: '6-9',  dedicatedPO: 'no', workMode: 'híbrido'   },
        { nombre: 'Ulises Vargas',    rol: 'Dev Team',      teamAge: '6-18m', teamSize: '6-9',  dedicatedPO: 'no', workMode: 'híbrido'   },
        { nombre: 'Victoria Medina',  rol: 'Dev Team',      teamAge: '<6m',   teamSize: '6-9',  dedicatedPO: 'no', workMode: 'híbrido'   },
      ],
    },
  ];

  // ── PASO 9: CREAR EQUIPOS Y RESPUESTAS ───────────────────────────────────

  console.log('\n👥 Creando equipos y respuestas...');
  const teamIds = {};

  for (const td of TEAM_DEFS) {
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
    console.log(`\n  Equipo: ${td.nombre} [${td.category}] — ${td.respondents.filter(r=>r.rol==='Dev Team').length} devs`);

    for (const ci of td.ciclosIdx) {
      const cycle   = cycles[ci];
      const targets = td.perfil[ci];
      if (!targets) continue;

      const teamComments   = (COMMENTS[td.key] || {})[ci] || {};
      const healthBase     = (HEALTH_BY_TEAM_CYCLE[td.key] || {})[ci] || null;
      const baseOffsetDays = cycle.offsetDays;

      const batch = db.batch();

      for (let r = 0; r < td.respondents.length; r++) {
        const resp   = td.respondents[r];
        const jitter = () => Math.floor(Math.random() * 5) - 2; // ±2

        let allAnswers = {};
        const scoreFields = {};
        let totalRaw = 0;

        const KEY_MAP = { eventos:'ev', backlog:'bl', devteam:'dt', transparencia:'tr', tecnico:'tc', cliente:'cl' };

        for (const sm of SECTIONS_META) {
          const t        = targets[KEY_MAP[sm.id]];
          const adjusted = Math.max(0, Math.min(sm.max, t + jitter()));
          const sAns     = genAnswers(sm.id, sm.numQ, adjusted);
          Object.assign(allAnswers, sAns);
          const rawScore = Object.values(sAns).reduce((a, b) => a + b, 0);
          scoreFields[sm.storeKey] = rawScore;
          totalRaw += rawScore;
        }

        const pct   = Math.round(totalRaw / MAX_TOTAL * 100);
        const nivel = getLevelLabel(pct);

        let teamHealthScore = null;
        let healthAnswers   = {};
        if (healthBase) {
          const hj = () => Math.max(0, Math.min(3, Math.floor(Math.random() * 2)));
          const h0 = Math.max(0, Math.min(3, healthBase.h0 + (Math.random() > 0.5 ? 0 : hj())));
          const h1 = Math.max(0, Math.min(3, healthBase.h1 + (Math.random() > 0.5 ? 0 : hj())));
          const h2 = Math.max(0, Math.min(3, healthBase.h2 + (Math.random() > 0.5 ? 0 : hj())));
          healthAnswers   = { health_0: h0, health_1: h1, health_2: h2 };
          teamHealthScore = Math.round((h0 + h1 + h2) / 9 * 100);
        }

        const comments = teamComments[r] || {};
        const fechaResp = daysAgo(baseOffsetDays - r * 0.4);
        const secsSinceStart = Math.floor(480 + Math.random() * 720); // 8-20 min

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
      console.log(`    Ciclo ${ci + 1} (${cycle.nombre}): ${td.respondents.length} resp · ~${pctApprox}% ${getLevelLabel(pctApprox)}`);
    }
  }

  // ── PASO 10: PLANES DE ACCIÓN ─────────────────────────────────────────────

  console.log('\n📋 Creando planes de acción...');
  const lastCiclo = cycles[2].nombre;

  const PLAN_DEFS = [
    // Fénix — equipo pequeño mejorando, foco en ceremonias y cliente
    { key: 'fenix', planes: [
      { iniciativa: 'Implementar acuerdos de trabajo al inicio de cada sprint', responsable: 'Scrum Master',  estado: 'completado', dimension: 'eventos', fechaObjetivo: '2025-09-15' },
      { iniciativa: 'Definir y comunicar el Product Goal a todo el equipo',     responsable: 'Product Owner', estado: 'en-curso',   dimension: 'backlog', fechaObjetivo: '2025-10-31' },
      { iniciativa: 'Establecer sesiones quincenales de feedback con usuarios', responsable: 'Product Owner', estado: 'pendiente',  dimension: 'cliente', fechaObjetivo: '2025-11-30' },
    ]},
    // Orión — equipo maduro optimizando
    { key: 'orion', planes: [
      { iniciativa: 'Implementar Continuous Discovery con usuarios clave',      responsable: 'Product Owner', estado: 'en-curso',   dimension: 'cliente', fechaObjetivo: '2025-12-31' },
      { iniciativa: 'Alcanzar 90% de cobertura de tests automatizados',        responsable: 'Dev Team',      estado: 'en-curso',   dimension: 'tecnico', fechaObjetivo: '2025-11-15' },
      { iniciativa: 'Documentar y socializar prácticas de ingeniería del equipo', responsable: 'Scrum Master', estado: 'pendiente', dimension: 'devteam', fechaObjetivo: '2025-12-15' },
    ]},
    // Titán — equipo grande con problemas de coordinación
    { key: 'titan', planes: [
      { iniciativa: 'Dividir el equipo en dos squads independientes de 4',      responsable: 'Scrum Master',  estado: 'pendiente',  dimension: 'devteam', fechaObjetivo: '2026-01-31' },
      { iniciativa: 'Reducir el Daily Scrum a 15 min con agenda estructurada',  responsable: 'Scrum Master',  estado: 'en-curso',   dimension: 'eventos', fechaObjetivo: '2025-10-31', updatedByTeam: true },
      { iniciativa: 'Crear Definition of Done compartida entre subgrupos',      responsable: 'Product Owner', estado: 'pendiente',  dimension: 'devteam', fechaObjetivo: '2025-11-15' },
    ]},
    // Nova — equipo de conocimiento consolidando
    { key: 'nova', planes: [
      { iniciativa: 'Implementar checklist de calidad para todos los entregables', responsable: 'Scrum Master', estado: 'en-curso',  dimension: 'tecnico', fechaObjetivo: '2025-10-31' },
      { iniciativa: 'Sesión trimestral de co-diseño con clientes internos',      responsable: 'Product Owner', estado: 'completado', dimension: 'cliente', fechaObjetivo: '2025-09-30' },
      { iniciativa: 'Crear repositorio central de conocimiento del equipo',      responsable: 'Dev Team',      estado: 'pendiente',  dimension: 'backlog', fechaObjetivo: '2025-12-15' },
    ]},
  ];

  const planBatch = db.batch();
  let totalPlanes = 0;
  for (const pg of PLAN_DEFS) {
    const equipoId = teamIds[pg.key];
    const tdDef    = TEAM_DEFS.find(t => t.key === pg.key);
    for (const p of pg.planes) {
      const pRef = db.collection('planes').doc();
      planBatch.set(pRef, {
        equipoId,
        equipoNombre:    tdDef.nombre,
        ciclo:           lastCiclo,
        iniciativa:      p.iniciativa,
        responsable:     p.responsable,
        fechaObjetivo:   p.fechaObjetivo,
        estado:          p.estado,
        dimension:       p.dimension,
        ownerId,
        updatedByTeam:   p.updatedByTeam || false,
        updatedByTeamAt: p.updatedByTeam ? ts(3) : null,
        portalToken:     null,
        fechaCreacion:   ts(20),
      });
      totalPlanes++;
    }
  }
  await planBatch.commit();
  console.log(`  ✓ ${totalPlanes} planes creados`);

  // ── RESUMEN ───────────────────────────────────────────────────────────────

  console.log('\n✅ Seed V5 completado!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('EQUIPOS CREADOS:');
  console.log('  Fénix  [Software]     · 1 SM + 1 PO + 3 devs · Q1→Q3 · "En desarrollo" → "Maduro"');
  console.log('  Orión  [Software]     · 1 SM + 1 PO + 5 devs · Q1→Q3 · "Maduro" estable → "Maduro"');
  console.log('  Titán  [Software]     · 1 SM + 1 PO + 8 devs · Q1→Q3 · "Inicial" → "En desarrollo"');
  console.log('  Nova   [Conocimiento] · 1 SM + 1 PO + 7 devs · Q2→Q3 · "En desarrollo" → "Maduro"');
  console.log('');
  console.log('FEATURES VISIBLES:');
  console.log('  ⚠  "Señal oculta"    → Fénix / Ceremonias (SM: "teatro" en score alto)');
  console.log('  📊 Benchmark          → 3 equipos Software (Fénix, Orión, Titán)');
  console.log('  🧠 No-software        → Nova (teamType=knowledge)');
  console.log('  ❤  Salud del equipo  → Fénix=Media · Orión=Alta · Titán=Baja · Nova=Media-Alta');
  console.log('  ↗  Momentum          → Fénix y Nova (mejorando)');
  console.log('  📈 Gráfico evolución  → Fénix, Orión y Titán (3 ciclos)');
  console.log('  🔄 Actualizado x equipo → Titán / Plan "Daily Scrum"');
  console.log('  👥 Panel participación → 1 SM + 1 PO + Dev Team en cada equipo');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Recarga la página (F5) para ver los datos.');
})();
