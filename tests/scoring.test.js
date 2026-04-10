import { getLevel, getRec, detectPatterns, getContextNote } from '../assessment-config.js';

// ── getLevel ──────────────────────────────────────────────────────

describe('getLevel', () => {
  test.each([
    [0,   'Inicial'],
    [40,  'Inicial'],
    [41,  'En desarrollo'],
    [65,  'En desarrollo'],
    [66,  'Maduro'],
    [82,  'Maduro'],
    [83,  'Avanzado'],
    [100, 'Avanzado'],
  ])('pct=%i → %s', (pct, label) => {
    expect(getLevel(pct).label).toBe(label);
  });

  test('retorna objeto con color y bg', () => {
    const level = getLevel(50);
    expect(level).toHaveProperty('color');
    expect(level).toHaveProperty('bg');
    expect(level).toHaveProperty('desc');
  });
});

// ── getRec ────────────────────────────────────────────────────────

describe('getRec', () => {
  test('distintos rangos de pct retornan distintas recomendaciones', () => {
    const r0 = getRec('eventos', 20,  null);
    const r1 = getRec('eventos', 50,  null);
    const r2 = getRec('eventos', 80,  null);
    expect(r0).not.toBe(r1);
    expect(r1).not.toBe(r2);
  });

  test('pct = 33 usa índice 0, pct = 34 usa índice 1', () => {
    expect(getRec('backlog', 33, null)).not.toBe(getRec('backlog', 34, null));
  });

  test('pct = 66 usa índice 1, pct = 67 usa índice 2', () => {
    expect(getRec('devteam', 66, null)).not.toBe(getRec('devteam', 67, null));
  });

  test('rec con rol difiere de rec genérica', () => {
    const generic = getRec('eventos', 20, null);
    const po      = getRec('eventos', 20, 'Product Owner');
    const sm      = getRec('eventos', 20, 'Scrum Master');
    expect(po).not.toBe(generic);
    expect(sm).not.toBe(generic);
  });

  test('todos los roles/dims retornan string no vacío', () => {
    const dims  = ['eventos', 'backlog', 'devteam', 'transparencia', 'tecnico', 'cliente'];
    const roles = [null, 'Product Owner', 'Dev Team', 'Scrum Master'];
    dims.forEach(dim => {
      roles.forEach(role => {
        [20, 50, 80].forEach(pct => {
          const rec = getRec(dim, pct, role);
          expect(typeof rec).toBe('string');
          expect(rec.length).toBeGreaterThan(0);
        });
      });
    });
  });
});

// ── detectPatterns ────────────────────────────────────────────────

describe('detectPatterns', () => {
  const high = { eventos:{pct:90}, backlog:{pct:90}, devteam:{pct:90}, transparencia:{pct:90}, tecnico:{pct:90}, cliente:{pct:90} };

  test('no detecta patrones cuando todo está alto', () => {
    expect(detectPatterns(high)).toHaveLength(0);
  });

  test('detecta Adopción inicial total cuando todas las dims < 40', () => {
    const scores = Object.fromEntries(Object.keys(high).map(k => [k, { pct: 35 }]));
    const found = detectPatterns(scores);
    expect(found.some(p => p.label === 'Adopción inicial total')).toBe(true);
  });

  test('detecta Base Scrum débil (eventos + transparencia < 50)', () => {
    const scores = { ...high, eventos: { pct: 40 }, transparencia: { pct: 40 } };
    const found = detectPatterns(scores);
    expect(found.some(p => p.label === 'Base Scrum débil')).toBe(true);
  });

  test('detecta Limitación técnica sistémica (devteam + tecnico < 45)', () => {
    const scores = { ...high, devteam: { pct: 40 }, tecnico: { pct: 40 } };
    const found = detectPatterns(scores);
    expect(found.some(p => p.label === 'Limitación técnica sistémica')).toBe(true);
  });

  test('detecta Desconexión del valor (backlog + cliente < 45)', () => {
    const scores = { ...high, backlog: { pct: 30 }, cliente: { pct: 30 } };
    const found = detectPatterns(scores);
    expect(found.some(p => p.label === 'Desconexión del valor')).toBe(true);
  });

  test('cada patrón detectado tiene label, color y text', () => {
    const scores = Object.fromEntries(Object.keys(high).map(k => [k, { pct: 30 }]));
    detectPatterns(scores).forEach(p => {
      expect(p).toHaveProperty('label');
      expect(p).toHaveProperty('color');
      expect(p).toHaveProperty('text');
    });
  });
});

// ── getContextNote ────────────────────────────────────────────────

describe('getContextNote', () => {
  test('retorna null sin contexto (tamano y tiempoScrum nulos)', () => {
    expect(getContextNote('eventos', 50, null, null)).toBeNull();
  });

  test('equipo nuevo (<6 meses) con pct < 70 → nota de priorizar cadencia', () => {
    const note = getContextNote('eventos', 50, '4–6', '<6 meses');
    expect(note).not.toBeNull();
    expect(note).toMatch(/nuevo/i);
  });

  test('>18 meses con pct < 50 → nota de impedimentos sistémicos', () => {
    const note = getContextNote('eventos', 30, '4–6', '>18 meses');
    expect(note).not.toBeNull();
    expect(note).toMatch(/18 meses/);
  });

  test('6–18 meses con pct < 40 → nota de apoyo organizacional', () => {
    const note = getContextNote('eventos', 30, '4–6', '6–18 meses');
    expect(note).not.toBeNull();
    expect(note).toMatch(/6–18 meses/);
  });

  test('equipo nuevo con pct >= 70 → sin nota', () => {
    expect(getContextNote('eventos', 75, '4–6', '<6 meses')).toBeNull();
  });
});
