// ─────────────────────────────────────────────────────────────────────────────
// SEED SCRIPT — AssessmentAgile
// Pegar en la consola del navegador mientras estás logueado en admin.html
// Crea: 3 equipos · 3 ciclos · 4-6 respuestas por equipo/ciclo · 9 planes
// ─────────────────────────────────────────────────────────────────────────────

(async function seed() {
  if (typeof state === 'undefined' || !state.currentUser) {
    console.error('❌ Debes estar logueado en admin.html primero. state.currentUser =', typeof state !== 'undefined' ? state.currentUser : 'state no existe');
    return;
  }

  const ownerId = state.currentUser.uid;
  const NOW = Date.now();
  const daysAgo = (d) => new Date(NOW - d * 864e5);
  const ts     = (d) => firebase.firestore.Timestamp.fromDate(daysAgo(d));

  // ── Helpers ────────────────────────────────────────────────────
  function getLevelLabel(pct) {
    if (pct <= 40) return 'Inicial';
    if (pct <= 65) return 'En desarrollo';
    if (pct <= 82) return 'Maduro';
    return 'Avanzado';
  }

  // Distribuye `target` puntos entre `numQ` preguntas (cada una 0-3)
  // garantizando que la suma sea exactamente `target`.
  function genAnswers(secId, numQ, target) {
    const safeTarget = Math.max(0, Math.min(numQ * 3, target));
    const ans = {};
    let remaining = safeTarget;
    for (let qi = 0; qi < numQ; qi++) {
      const questLeft = numQ - qi;
      const maxV = Math.min(3, remaining);
      const minV = Math.max(0, remaining - (questLeft - 1) * 3);
      const range = maxV - minV;
      const val   = minV + (range > 0 ? Math.floor(Math.random() * (range + 1)) : 0);
      ans[`${secId}_${qi}`] = val;
      remaining -= val;
    }
    return ans;
  }

  // ── Configuración de secciones ─────────────────────────────────
  const SECTIONS_META = [
    { id: 'eventos',       numQ: 4, storeKey: 'scoreEventos',       max: 12 },
    { id: 'backlog',       numQ: 3, storeKey: 'scoreBacklog',        max:  9 },
    { id: 'devteam',       numQ: 4, storeKey: 'scoreDevTeam',        max: 12 },
    { id: 'transparencia', numQ: 3, storeKey: 'scoreTransparencia',  max:  9 },
    { id: 'tecnico',       numQ: 3, storeKey: 'scoreTecnico',        max:  9 },
    { id: 'cliente',       numQ: 3, storeKey: 'scoreCliente',        max:  9 },
  ];
  const MAX_TOTAL = 60;

  // ── Ciclos ─────────────────────────────────────────────────────
  const CYCLE_DEFS = [
    { nombre: 'Q1 2025 – Enero/Marzo',    activo: false, daysAgo: 90 },
    { nombre: 'Q2 2025 – Abril/Junio',    activo: false, daysAgo: 55 },
    { nombre: 'Q3 2025 – Julio/Sep',      activo: true,  daysAgo: 20 },
  ];

  console.log('⏳ Creando ciclos...');
  const cycles = []; // { id, nombre }
  for (const cd of CYCLE_DEFS) {
    const ref = await db.collection('ciclos').add({
      nombre:    cd.nombre,
      activo:    cd.activo,
      ownerId,
      creadoEn:  ts(cd.daysAgo),
    });
    cycles.push({ id: ref.id, nombre: cd.nombre, daysAgo: cd.daysAgo });
    console.log(' ✓', cd.nombre);
  }

  // ── Perfiles de score por equipo/ciclo ─────────────────────────
  // Cada entrada: { eventos, backlog, devteam, transparencia, tecnico, cliente }
  // Son los targets de score por sección para el promedio del ciclo.
  //
  // Alpha: En desarrollo → Maduro (equipo que mejora)
  // Beta:  Inicial (equipo que lucha)
  // Gamma: Maduro → Avanzado (equipo de alto rendimiento)
  const PROFILES = {
    improving: [
      { eventos:  7, backlog: 4, devteam:  7, transparencia: 4, tecnico: 3, cliente: 3 }, // 28/60 = 47%
      { eventos:  9, backlog: 6, devteam:  8, transparencia: 5, tecnico: 4, cliente: 4 }, // 36/60 = 60%
      { eventos: 10, backlog: 7, devteam: 10, transparencia: 6, tecnico: 6, cliente: 6 }, // 45/60 = 75%
    ],
    struggling: [
      { eventos:  4, backlog: 3, devteam:  4, transparencia: 3, tecnico: 2, cliente: 2 }, // 18/60 = 30%
      { eventos:  6, backlog: 4, devteam:  5, transparencia: 4, tecnico: 2, cliente: 3 }, // 24/60 = 40%
      { eventos:  7, backlog: 5, devteam:  6, transparencia: 4, tecnico: 3, cliente: 3 }, // 28/60 = 47%
    ],
    advanced: [
      { eventos: 10, backlog: 7, devteam: 10, transparencia: 6, tecnico: 5, cliente: 5 }, // 43/60 = 72%
      { eventos: 11, backlog: 8, devteam: 11, transparencia: 7, tecnico: 6, cliente: 6 }, // 49/60 = 82%
      { eventos: 12, backlog: 9, devteam: 12, transparencia: 8, tecnico: 6, cliente: 6 }, // 53/60 = 88%
    ],
  };

  const TEAM_DEFS = [
    { nombre: 'Equipo Alpha', descripcion: 'Producto digital · Frontend',  perfil: 'improving'  },
    { nombre: 'Equipo Beta',  descripcion: 'Plataforma · Backend',         perfil: 'struggling' },
    { nombre: 'Equipo Gamma', descripcion: 'Datos e Inteligencia',         perfil: 'advanced'   },
  ];

  const ROLES        = ['Product Owner', 'Dev Team', 'Dev Team', 'Scrum Master', 'Dev Team', 'Dev Team'];
  const SIZES        = ['6-9', '6-9', '1-5', '10+'];
  const SCRUM_TIMES  = ['>18m', '>18m', '6-18m', '6-18m', '<6m', '>18m'];
  const NAMES        = ['Anónimo','María G.','Carlos R.','Ana P.','Luis M.','Sofía V.',
                        'Pedro A.','Laura B.','Diego C.','Valentina D.'];

  console.log('\n⏳ Creando equipos y respuestas...');
  const teamIds = []; // para usar en planes

  for (let ti = 0; ti < TEAM_DEFS.length; ti++) {
    const td = TEAM_DEFS[ti];
    const tRef = await db.collection('equipos').add({
      nombre:      td.nombre,
      descripcion: td.descripcion,
      ownerId,
      creadoEn:    ts(100),
    });
    teamIds.push(tRef.id);
    console.log(`\n Equipo: ${td.nombre} (${tRef.id})`);

    for (let ci = 0; ci < cycles.length; ci++) {
      const cycle      = cycles[ci];
      const targets    = PROFILES[td.perfil][ci];
      const numResp    = 4 + Math.floor(Math.random() * 3); // 4-6
      const baseOffset = cycle.daysAgo;

      const batch = db.batch();

      for (let r = 0; r < numResp; r++) {
        const rol          = ROLES[r % ROLES.length];
        const participante = NAMES[r % NAMES.length];
        const tamanoEquipo = SIZES[r % SIZES.length];
        const tiempoScrum  = SCRUM_TIMES[r % SCRUM_TIMES.length];

        let allAnswers = {};
        const scoreFields = {};
        let totalScore = 0;

        for (const sm of SECTIONS_META) {
          // Jitter de ±2 por respondente para variabilidad realista
          const jitter   = Math.floor(Math.random() * 5) - 2;
          const adjusted = Math.max(0, Math.min(sm.max, targets[sm.id] + jitter));
          const sAns     = genAnswers(sm.id, sm.numQ, adjusted);
          Object.assign(allAnswers, sAns);
          const sScore   = Object.values(sAns).reduce((a, b) => a + b, 0);
          scoreFields[sm.storeKey] = sScore;
          totalScore += sScore;
        }

        const pct   = Math.round(totalScore / MAX_TOTAL * 100);
        const nivel = getLevelLabel(pct);
        const fecha = daysAgo(baseOffset - r * 0.4); // respuestas escalonadas

        const rRef = db.collection('respuestas').doc();
        batch.set(rRef, {
          equipoId:     tRef.id,
          equipoNombre: td.nombre,
          participante,
          rol,
          ciclo:        cycle.nombre, // nombre del ciclo, no el ID
          tamanoEquipo,
          tiempoScrum,
          ...scoreFields,
          scoreTotalPct: pct,
          nivel,
          answers:       allAnswers,
          comments:      {},
          customAnswers: {},
          fecha:         firebase.firestore.Timestamp.fromDate(fecha),
        });
      }

      await batch.commit();
      console.log(`  Ciclo ${ci + 1} (${cycle.nombre}): ${numResp} respuestas`);
    }
  }

  // ── Planes de acción ────────────────────────────────────────────
  console.log('\n⏳ Creando planes de acción...');
  const lastCycle = cycles[cycles.length - 1].nombre;

  const PLAN_DEFS = [
    // Alpha (improving)
    {
      ti: 0, planes: [
        { iniciativa: 'Reforzar Sprint Goal en la planning', responsable: 'Scrum Master', estado: 'completado', dimension: 'eventos', fechaObjetivo: '2025-06-30' },
        { iniciativa: 'Implementar CI/CD pipeline completo',  responsable: 'Tech Lead',    estado: 'en-curso',   dimension: 'tecnico', fechaObjetivo: '2025-09-30' },
        { iniciativa: 'Establecer métricas de valor por producto', responsable: 'Product Owner', estado: 'pendiente', dimension: 'cliente', fechaObjetivo: '2025-10-31' },
      ]
    },
    // Beta (struggling)
    {
      ti: 1, planes: [
        { iniciativa: 'Crear y acordar Definition of Done',    responsable: 'Scrum Master',  estado: 'en-curso',  dimension: 'devteam', fechaObjetivo: '2025-08-31' },
        { iniciativa: 'Ordenar backlog por valor de negocio',  responsable: 'Product Owner', estado: 'pendiente', dimension: 'backlog', fechaObjetivo: '2025-09-15' },
        { iniciativa: 'Capacitación en testing automatizado',  responsable: 'Dev Team',      estado: 'pendiente', dimension: 'tecnico', fechaObjetivo: '2025-10-31' },
      ]
    },
    // Gamma (advanced)
    {
      ti: 2, planes: [
        { iniciativa: 'Expandir cobertura de pruebas al 90%', responsable: 'Dev Team',      estado: 'en-curso',   dimension: 'tecnico', fechaObjetivo: '2025-09-30' },
        { iniciativa: 'Workshop trimestral con usuarios',      responsable: 'Product Owner', estado: 'completado', dimension: 'cliente', fechaObjetivo: '2025-07-31' },
        { iniciativa: 'Reducir lead time con límites WIP',     responsable: 'Scrum Master',  estado: 'completado', dimension: 'devteam', fechaObjetivo: '2025-07-15' },
      ]
    },
  ];

  const planBatch = db.batch();
  for (const pg of PLAN_DEFS) {
    const equipoId = teamIds[pg.ti];
    for (const p of pg.planes) {
      const pRef = db.collection('planes').doc();
      planBatch.set(pRef, {
        equipoId,
        ciclo:         lastCycle,
        iniciativa:    p.iniciativa,
        responsable:   p.responsable,
        fechaObjetivo: p.fechaObjetivo,
        estado:        p.estado,
        dimension:     p.dimension,
        ownerId,
        updatedByTeam: false,
        portalToken:   null,
        fechaCreacion: ts(15),
      });
    }
  }
  await planBatch.commit();

  console.log('\n✅ Seed completado!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Equipos   : ${TEAM_DEFS.map(t => t.nombre).join(' · ')}`);
  console.log(`Ciclos    : ${cycles.map(c => c.nombre).join(' · ')}`);
  console.log(`Respuestas: ~${TEAM_DEFS.length * cycles.length * 5} (4-6 por equipo/ciclo)`);
  console.log(`Planes    : 9 (3 por equipo)`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Recarga la página (F5) para ver los datos.');
})();
