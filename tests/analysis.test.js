import { calcDispersion, isPolarized, detectRoleGaps, getMajorityRole, getTeamFilteredStats, computeStats, generateDebriefGuide } from '../assets/admin-api.js';

// ── calcDispersion ────────────────────────────────────────────────

describe('calcDispersion', () => {
  test('retorna null con array vacío', () => {
    expect(calcDispersion([])).toBeNull();
  });
  test('retorna null con un solo elemento', () => {
    expect(calcDispersion([50])).toBeNull();
  });

  test('alineación Alta cuando sd < 15 (valores similares)', () => {
    const result = calcDispersion([50, 51, 49, 50]);
    expect(result.align.label).toBe('Alta');
  });

  test('alineación Baja cuando sd >= 25 (valores dispersos)', () => {
    const result = calcDispersion([0, 50, 100]);
    expect(result.align.label).toBe('Baja');
  });

  test('calcula min y max correctamente', () => {
    const result = calcDispersion([20, 40, 60, 80]);
    expect(result.min).toBe(20);
    expect(result.max).toBe(80);
  });

  test('retorna sd como entero', () => {
    const result = calcDispersion([30, 70]);
    expect(Number.isInteger(result.sd)).toBe(true);
  });
});

// ── isPolarized ───────────────────────────────────────────────────

describe('isPolarized', () => {
  test('true cuando extremos suman ≥50% y ambos presentes', () => {
    // 2 en 0, 2 en 3, 0 en medios → 100% extremos
    expect(isPolarized([2, 0, 0, 2])).toBe(true);
  });

  test('true con extremos en exacto 50%', () => {
    // 1 en 0, 1 en 3, 2 en medios → 50%
    expect(isPolarized([1, 1, 1, 1])).toBe(true);
  });

  test('false cuando extremos < 50%', () => {
    // 1 en 0, 1 en 3, 6 en medios → 25%
    expect(isPolarized([1, 3, 3, 1])).toBe(false);
  });

  test('false cuando solo hay respuestas en un extremo', () => {
    // Solo ceros — no hay polarización, es consenso negativo
    expect(isPolarized([4, 0, 0, 0])).toBe(false);
  });

  test('false cuando no hay respuestas en el extremo inferior', () => {
    expect(isPolarized([0, 0, 1, 3])).toBe(false);
  });

  test('false con menos de 3 respuestas totales', () => {
    expect(isPolarized([1, 0, 0, 1])).toBe(false);
  });

  test('false con counts vacío (sin respuestas)', () => {
    expect(isPolarized([0, 0, 0, 0])).toBe(false);
  });
});

// ── getMajorityRole ───────────────────────────────────────────────

describe('getMajorityRole', () => {
  const r = (rol) => ({ fields: { Rol: rol } });

  test('retorna el rol con más respuestas', () => {
    const resps = [r('Dev Team'), r('Dev Team'), r('Product Owner')];
    expect(getMajorityRole(resps)).toBe('Dev Team');
  });

  test('retorna null en caso de empate', () => {
    const resps = [r('Dev Team'), r('Product Owner')];
    expect(getMajorityRole(resps)).toBeNull();
  });

  test('ignora el rol Otro', () => {
    const resps = [r('Otro'), r('Otro'), r('Dev Team')];
    expect(getMajorityRole(resps)).toBe('Dev Team');
  });

  test('retorna null con array vacío', () => {
    expect(getMajorityRole([])).toBeNull();
  });

  test('retorna null cuando solo hay Otro', () => {
    expect(getMajorityRole([r('Otro'), r('Otro')])).toBeNull();
  });
});

// ── helpers para construir respuestas de test ─────────────────────

function makeResponse({ teamId = 'team1', rol = 'Dev Team', ciclo = 'Sprint 1',
  scoreEventos = 10, scoreBacklog = 7, scoreDevTeam = 10,
  scoreTransparencia = 7, scoreTecnico = 7, scoreCliente = 7,
  totalPct = 80, tamano = '4–6', tiempoScrum = '6–18 meses' } = {}) {
  return {
    fields: {
      Equipo: [teamId],
      Rol: rol,
      Ciclo: ciclo,
      'Score Eventos': scoreEventos,
      'Score Backlog': scoreBacklog,
      'Score Dev Team': scoreDevTeam,
      'Score Transparencia': scoreTransparencia,
      'Score Técnico': scoreTecnico,
      'Score Cliente': scoreCliente,
      'Score Total %': totalPct,
      'Tamaño Equipo': tamano,
      'Tiempo Scrum': tiempoScrum,
      Answers: {}
    }
  };
}

// ── getTeamFilteredStats ──────────────────────────────────────────

describe('getTeamFilteredStats', () => {
  beforeEach(() => {
    state.responses = [
      makeResponse({ totalPct: 80, rol: 'Dev Team', ciclo: 'Sprint 1' }),
      makeResponse({ totalPct: 60, rol: 'Product Owner', ciclo: 'Sprint 1' }),
      makeResponse({ totalPct: 70, rol: 'Dev Team', ciclo: 'Sprint 2' })
    ];
  });

  test('retorna null si no hay respuestas para el equipo', () => {
    expect(getTeamFilteredStats('equipo_inexistente', 'Todos', 'Todos')).toBeNull();
  });

  test('cuenta todas las respuestas sin filtros', () => {
    const stats = getTeamFilteredStats('team1', 'Todos', 'Todos');
    expect(stats.count).toBe(3);
  });

  test('calcula avgTotal como promedio de Score Total %', () => {
    const stats = getTeamFilteredStats('team1', 'Todos', 'Todos');
    expect(stats.avgTotal).toBe(Math.round((80 + 60 + 70) / 3));
  });

  test('filtra por rol correctamente', () => {
    const stats = getTeamFilteredStats('team1', 'Dev Team', 'Todos');
    expect(stats.count).toBe(2);
    expect(stats.avgTotal).toBe(Math.round((80 + 70) / 2));
  });

  test('filtra por ciclo correctamente', () => {
    const stats = getTeamFilteredStats('team1', 'Todos', 'Sprint 1');
    expect(stats.count).toBe(2);
  });

  test('retorna null cuando el filtro no da resultados', () => {
    expect(getTeamFilteredStats('team1', 'Todos', 'Sprint X')).toBeNull();
  });

  test('incluye nivel (level) en el resultado', () => {
    const stats = getTeamFilteredStats('team1', 'Todos', 'Todos');
    expect(stats.level).toBeDefined();
    expect(stats.level).toHaveProperty('label');
  });

  test('incluye avgDims para cada dimensión', () => {
    const stats = getTeamFilteredStats('team1', 'Todos', 'Todos');
    DIMS.forEach(d => {
      expect(stats.avgDims[d.key]).toBeDefined();
      expect(stats.avgDims[d.key]).toHaveProperty('pct');
      expect(stats.avgDims[d.key]).toHaveProperty('score');
    });
  });
});

// ── computeStats ──────────────────────────────────────────────────

describe('computeStats', () => {
  beforeEach(() => {
    state.teams = [
      { id: 'team1', name: 'Alpha', active: true },
      { id: 'team2', name: 'Beta',  active: true }
    ];
    state.responses = [
      makeResponse({ teamId: 'team1', totalPct: 80 }),
      makeResponse({ teamId: 'team1', totalPct: 60 }),
      makeResponse({ teamId: 'team2', totalPct: 40 })
    ];
    state.teamStats = {};
  });

  test('crea entradas en teamStats para cada equipo', () => {
    computeStats();
    expect(state.teamStats['team1']).toBeDefined();
    expect(state.teamStats['team2']).toBeDefined();
  });

  test('cuenta respuestas por equipo', () => {
    computeStats();
    expect(state.teamStats['team1'].count).toBe(2);
    expect(state.teamStats['team2'].count).toBe(1);
  });

  test('calcula avgTotal correcto', () => {
    computeStats();
    expect(state.teamStats['team1'].avgTotal).toBe(Math.round((80 + 60) / 2));
    expect(state.teamStats['team2'].avgTotal).toBe(40);
  });

  test('asigna nivel correcto según avgTotal', () => {
    computeStats();
    // team1 avgTotal = 70 → Maduro (66-82)
    expect(state.teamStats['team1'].level.label).toBe('Maduro');
    // team2 avgTotal = 40 → Inicial (<=40)
    expect(state.teamStats['team2'].level.label).toBe('Inicial');
  });

  test('equipo sin respuestas no tiene avgTotal', () => {
    state.teams.push({ id: 'team3', name: 'Gamma', active: true });
    computeStats();
    expect(state.teamStats['team3'].count).toBe(0);
    expect(state.teamStats['team3'].avgTotal).toBeUndefined();
  });
});

// ── detectRoleGaps ────────────────────────────────────────────────

describe('detectRoleGaps', () => {
  // Helper: 3 respuestas de un rol con el mismo porcentaje en todas las dimensiones
  function makeRoleResps(teamId, rol, ciclo, dimPct) {
    const base = { Equipo: [teamId], Rol: rol, Ciclo: ciclo, 'Score Total %': dimPct };
    DIMS.forEach(d => { base[d.field] = Math.round((dimPct / 100) * d.max); });
    return Array.from({ length: 3 }, () => ({ fields: { ...base } }));
  }

  beforeEach(() => {
    state.cycles = [{ id: 'c1', name: 'Q1', active: true }];
  });

  test('retorna array vacío cuando no hay roles con suficientes respuestas', () => {
    // Solo 1 respuesta por rol — por debajo del umbral de 3
    state.responses = [
      { fields: { Equipo: ['t1'], Rol: 'Dev Team', Ciclo: 'Q1', 'Score Eventos': 8, 'Score Backlog': 6, 'Score Dev Team': 8, 'Score Transparencia': 6, 'Score Técnico': 6, 'Score Cliente': 6, 'Score Total %': 70 } },
      { fields: { Equipo: ['t1'], Rol: 'Product Owner', Ciclo: 'Q1', 'Score Eventos': 4, 'Score Backlog': 3, 'Score Dev Team': 4, 'Score Transparencia': 3, 'Score Técnico': 3, 'Score Cliente': 3, 'Score Total %': 33 } }
    ];
    expect(detectRoleGaps('t1', 'Todos')).toHaveLength(0);
  });

  test('retorna array vacío cuando solo hay un rol con suficientes respuestas', () => {
    state.responses = makeRoleResps('t1', 'Dev Team', 'Q1', 70);
    expect(detectRoleGaps('t1', 'Todos')).toHaveLength(0);
  });

  test('detecta brecha cuando la diferencia supera el umbral', () => {
    state.responses = [
      ...makeRoleResps('t1', 'Dev Team', 'Q1', 80),
      ...makeRoleResps('t1', 'Product Owner', 'Q1', 30)
    ];
    const gaps = detectRoleGaps('t1', 'Todos', 25);
    expect(gaps.length).toBeGreaterThan(0);
    expect(gaps[0].diff).toBeGreaterThanOrEqual(25);
  });

  test('no detecta brecha cuando la diferencia es menor al umbral', () => {
    state.responses = [
      ...makeRoleResps('t1', 'Dev Team', 'Q1', 70),
      ...makeRoleResps('t1', 'Product Owner', 'Q1', 65)
    ];
    const gaps = detectRoleGaps('t1', 'Todos', 25);
    expect(gaps).toHaveLength(0);
  });

  test('las brechas se ordenan de mayor a menor diferencia', () => {
    state.responses = [
      ...makeRoleResps('t1', 'Dev Team', 'Q1', 80),
      ...makeRoleResps('t1', 'Product Owner', 'Q1', 30)
    ];
    const gaps = detectRoleGaps('t1', 'Todos', 0);
    for (let i = 1; i < gaps.length; i++) {
      expect(gaps[i - 1].diff).toBeGreaterThanOrEqual(gaps[i].diff);
    }
  });

  test('aplica filtro de ciclo correctamente', () => {
    state.responses = [
      ...makeRoleResps('t1', 'Dev Team', 'Q1', 80),
      ...makeRoleResps('t1', 'Product Owner', 'Q1', 30),
      ...makeRoleResps('t1', 'Dev Team', 'Q2', 60),
      ...makeRoleResps('t1', 'Product Owner', 'Q2', 55)
    ];
    const gapsQ1 = detectRoleGaps('t1', 'Q1', 25);
    const gapsQ2 = detectRoleGaps('t1', 'Q2', 25);
    expect(gapsQ1.length).toBeGreaterThan(0);
    expect(gapsQ2).toHaveLength(0);
  });

  test('cada gap incluye roleHigh, pctHigh, roleLow, pctLow', () => {
    state.responses = [
      ...makeRoleResps('t1', 'Dev Team', 'Q1', 80),
      ...makeRoleResps('t1', 'Product Owner', 'Q1', 30)
    ];
    const gaps = detectRoleGaps('t1', 'Todos', 25);
    const g = gaps[0];
    expect(g).toHaveProperty('roleHigh');
    expect(g).toHaveProperty('pctHigh');
    expect(g).toHaveProperty('roleLow');
    expect(g).toHaveProperty('pctLow');
    expect(g.pctHigh).toBeGreaterThan(g.pctLow);
  });
});

// ── generateDebriefGuide ──────────────────────────────────────────

describe('generateDebriefGuide', () => {
  function makeResp(teamId, ciclo, pct, rol = 'Dev Team') {
    const base = { Equipo: [teamId], Rol: rol, Ciclo: ciclo, 'Score Total %': pct, Answers: {} };
    DIMS.forEach(d => { base[d.field] = Math.round((pct / 100) * d.max); });
    return { fields: base };
  }

  beforeEach(() => {
    state.teams = [{ id: 'team1', name: 'Alpha', active: true, notas: {} }];
    state.cycles = [
      { id: 'c1', name: 'Q1', active: false },
      { id: 'c2', name: 'Q2', active: true },
    ];
    state.responses = [
      makeResp('team1', 'Q1', 50),
      makeResp('team1', 'Q2', 70),
    ];
  });

  test('retorna null cuando el equipo no existe', () => {
    expect(generateDebriefGuide('equipo_inexistente', 'Todos')).toBeNull();
  });

  test('retorna null cuando no hay respuestas para el equipo', () => {
    state.responses = [];
    expect(generateDebriefGuide('team1', 'Todos')).toBeNull();
  });

  test('retorna estructura correcta con datos válidos', () => {
    const guide = generateDebriefGuide('team1', 'Todos');
    expect(guide).not.toBeNull();
    expect(guide).toHaveProperty('teamName', 'Alpha');
    expect(guide).toHaveProperty('stats');
    expect(guide).toHaveProperty('opportunities');
    expect(guide).toHaveProperty('celebrations');
    expect(guide).toHaveProperty('gaps');
  });

  test('opportunities incluye máximo 3 dimensiones', () => {
    const guide = generateDebriefGuide('team1', 'Todos');
    expect(guide.opportunities.length).toBeLessThanOrEqual(3);
    expect(guide.opportunities.length).toBeGreaterThan(0);
  });

  test('cada oportunidad incluye preguntas de coaching', () => {
    const guide = generateDebriefGuide('team1', 'Todos');
    guide.opportunities.forEach(op => {
      expect(op.questions).toBeDefined();
      expect(op.questions).toHaveLength(3);
      expect(typeof op.questions[0]).toBe('string');
    });
  });

  test('preguntas corresponden al nivel bajo cuando pct <= 33%', () => {
    // Forzar score bajo en todas las dims
    state.responses = [makeResp('team1', 'Q1', 20)];
    const guide = generateDebriefGuide('team1', 'Todos');
    guide.opportunities.forEach(op => {
      const lvl0Qs = COACHING_QUESTIONS[op.key][0];
      expect(op.questions).toEqual(lvl0Qs);
    });
  });

  test('preguntas corresponden al nivel medio cuando pct está entre 34% y 66%', () => {
    state.responses = [makeResp('team1', 'Q1', 50)];
    const guide = generateDebriefGuide('team1', 'Todos');
    guide.opportunities.forEach(op => {
      const lvl1Qs = COACHING_QUESTIONS[op.key][1];
      expect(op.questions).toEqual(lvl1Qs);
    });
  });

  test('detecta celebraciones cuando una dimensión mejoró >= 5 pts', () => {
    // Q1: 40%, Q2: 70% → todas las dims mejoraron ~30 pts
    state.responses = [
      makeResp('team1', 'Q1', 40),
      makeResp('team1', 'Q2', 70),
    ];
    const guide = generateDebriefGuide('team1', 'Q2');
    expect(guide.celebrations.length).toBeGreaterThan(0);
    guide.celebrations.forEach(c => {
      expect(c.pct - c.prevPct).toBeGreaterThanOrEqual(5);
    });
  });

  test('no hay celebraciones cuando solo hay un ciclo', () => {
    state.responses = [makeResp('team1', 'Q1', 70)];
    const guide = generateDebriefGuide('team1', 'Todos');
    expect(guide.celebrations).toHaveLength(0);
  });

  test('celebrations se ordenan de mayor a menor delta', () => {
    state.responses = [
      makeResp('team1', 'Q1', 40),
      makeResp('team1', 'Q2', 70),
    ];
    const guide = generateDebriefGuide('team1', 'Q2');
    for (let i = 1; i < guide.celebrations.length; i++) {
      const prev = guide.celebrations[i - 1];
      const curr = guide.celebrations[i];
      expect(prev.pct - prev.prevPct).toBeGreaterThanOrEqual(curr.pct - curr.prevPct);
    }
  });

  test('filtra por cycleFilter correctamente en stats', () => {
    const guide = generateDebriefGuide('team1', 'Q2');
    expect(guide.stats.count).toBe(1);
    expect(guide.stats.avgTotal).toBe(70);
  });

  test('stats incluye nivel, avgTotal y count', () => {
    const guide = generateDebriefGuide('team1', 'Todos');
    expect(guide.stats).toHaveProperty('avgTotal');
    expect(guide.stats).toHaveProperty('count');
    expect(guide.stats).toHaveProperty('level');
    expect(guide.stats.level).toHaveProperty('label');
  });
});
