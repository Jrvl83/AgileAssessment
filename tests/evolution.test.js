import { getEvolutionData, calcMomentum } from '../assets/admin-api.js';

function makeResponse({ teamId = 'team1', rol = 'Dev Team', ciclo = 'Sprint 1',
  scoreEventos = 10, scoreBacklog = 7, scoreDevTeam = 10,
  scoreTransparencia = 7, scoreTecnico = 7, scoreCliente = 7,
  totalPct = 75, answers = {} } = {}) {
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
      'Tamaño Equipo': '4–6',
      'Tiempo Scrum': '6–18 meses',
      Answers: answers
    }
  };
}

describe('getEvolutionData', () => {
  beforeEach(() => {
    state.cycles = [
      { id: 'c1', name: 'Sprint 1', active: false },
      { id: 'c2', name: 'Sprint 2', active: true  }
    ];
    state.responses = [
      makeResponse({ ciclo: 'Sprint 1', totalPct: 60, answers: { q1: 2, q2: 1 } }),
      makeResponse({ ciclo: 'Sprint 2', totalPct: 80, answers: { q1: 3, q2: 3 } }),
      makeResponse({ teamId: 'team2', ciclo: 'Sprint 1', totalPct: 40 })
    ];
  });

  test('filtra respuestas del equipo indicado', () => {
    const data = getEvolutionData('team1', 'Todos');
    expect(data).toHaveLength(2);
    data.forEach(d => expect(['Sprint 1', 'Sprint 2']).toContain(d.cycleName));
  });

  test('retorna array vacío para equipo sin respuestas', () => {
    expect(getEvolutionData('equipo_inexistente', 'Todos')).toHaveLength(0);
  });

  test('ordena por posición en state.cycles', () => {
    const data = getEvolutionData('team1', 'Todos');
    expect(data[0].cycleName).toBe('Sprint 1');
    expect(data[1].cycleName).toBe('Sprint 2');
  });

  test('calcula avgTotal correcto por ciclo', () => {
    const data = getEvolutionData('team1', 'Todos');
    const s1 = data.find(d => d.cycleName === 'Sprint 1');
    const s2 = data.find(d => d.cycleName === 'Sprint 2');
    expect(s1.avgTotal).toBe(60);
    expect(s2.avgTotal).toBe(80);
  });

  test('filtra por rol correctamente', () => {
    state.responses[0] = makeResponse({ ciclo: 'Sprint 1', rol: 'Product Owner', totalPct: 60 });
    const data = getEvolutionData('team1', 'Dev Team');
    expect(data).toHaveLength(1);
    expect(data[0].cycleName).toBe('Sprint 2');
  });

  test('incluye avgDims para cada dimensión', () => {
    const data = getEvolutionData('team1', 'Todos');
    data.forEach(cycle => {
      DIMS.forEach(d => {
        expect(cycle.avgDims[d.key]).toBeDefined();
        expect(cycle.avgDims[d.key]).toHaveProperty('pct');
      });
    });
  });

  test('incluye avgQuestions cuando hay Answers', () => {
    const data = getEvolutionData('team1', 'Todos');
    const s1 = data.find(d => d.cycleName === 'Sprint 1');
    expect(s1.avgQuestions).toBeDefined();
    expect(s1.avgQuestions.q1).toBe(2);
    expect(s1.avgQuestions.q2).toBe(1);
  });

  test('avgQuestions es null cuando Answers está vacío', () => {
    state.responses = [makeResponse({ ciclo: 'Sprint 1', answers: {} })];
    const data = getEvolutionData('team1', 'Todos');
    expect(data[0].avgQuestions).toBeNull();
  });

  test('incluye nivel en cada ciclo', () => {
    const data = getEvolutionData('team1', 'Todos');
    data.forEach(cycle => {
      expect(cycle.level).toBeDefined();
      expect(cycle.level).toHaveProperty('label');
    });
  });

  test('agrupa respuestas de múltiples participantes en el mismo ciclo', () => {
    state.responses = [
      makeResponse({ ciclo: 'Sprint 1', totalPct: 60 }),
      makeResponse({ ciclo: 'Sprint 1', totalPct: 80, answers: { q1: 4 } }),
    ];
    const data = getEvolutionData('team1', 'Todos');
    expect(data).toHaveLength(1);
    expect(data[0].count).toBe(2);
    expect(data[0].avgTotal).toBe(Math.round((60 + 80) / 2));
  });
});

// ── calcMomentum ──────────────────────────────────────────────────

describe('calcMomentum', () => {
  function setup(totals) {
    state.cycles = totals.map((_, i) => ({ id: 'c' + i, name: 'C' + i, active: i === totals.length - 1 }));
    state.responses = totals.map((pct, i) => makeResponse({ ciclo: 'C' + i, totalPct: pct }));
  }

  test('retorna null con un solo ciclo', () => {
    setup([60]);
    expect(calcMomentum('team1', 'Todos')).toBeNull();
  });

  test('retorna null con equipo sin respuestas', () => {
    setup([60, 70]);
    expect(calcMomentum('equipo_inexistente', 'Todos')).toBeNull();
  });

  test('dirección up cuando delta promedio > 2', () => {
    setup([50, 65]); // delta +15
    const m = calcMomentum('team1', 'Todos');
    expect(m.direction).toBe('up');
    expect(m.avg).toBe(15);
  });

  test('dirección down cuando delta promedio < -2', () => {
    setup([70, 55]); // delta -15
    const m = calcMomentum('team1', 'Todos');
    expect(m.direction).toBe('down');
    expect(m.avg).toBe(-15);
  });

  test('dirección flat cuando delta está entre -2 y 2', () => {
    setup([60, 61]); // delta +1
    const m = calcMomentum('team1', 'Todos');
    expect(m.direction).toBe('flat');
  });

  test('usa los últimos n ciclos cuando hay más de n', () => {
    // Ciclos: 30→60→62→64 — últimos 3: deltas +2, +2 → avg 2 → flat
    setup([30, 60, 62, 64]);
    const m = calcMomentum('team1', 'Todos', 3);
    expect(m.cycles).toBe(3);
    expect(m.avg).toBe(2);
  });

  test('promedia correctamente múltiples deltas', () => {
    // deltas: +10, +20 → avg 15
    setup([40, 50, 70]);
    const m = calcMomentum('team1', 'Todos');
    expect(m.avg).toBe(15);
    expect(m.direction).toBe('up');
  });
});
