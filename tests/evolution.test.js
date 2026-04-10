import { getEvolutionData } from '../assets/admin-api.js';

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
