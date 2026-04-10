import { calcDispersion, getMajorityRole, getTeamFilteredStats, computeStats } from '../assets/admin-api.js';

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
