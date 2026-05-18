import { e } from './escape.js';
import { state } from './admin-state.js';
import { db } from '../src/firebase-compat.js';
import { toast } from './admin-toast.js';
import { DIMS } from '../assessment-config.js';

// ── Búsqueda y filtrado global de equipos ────────────────────────

export function filterTeams(query) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return state.teams;
  return state.teams.filter(
    (t) => t.name.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q)
  );
}

// Renderiza el bloque de resultados de búsqueda en el contenedor dado.
// Bug #1 (XSS): `query` proviene del input del usuario y se interpola
// directamente en innerHTML sin pasar por e(). Un valor como
// <img src=x onerror=alert(document.cookie)> se ejecuta en el DOM.
export function renderSearchResults(container, teams, query) {
  if (!container) return;

  if (!teams.length) {
    container.innerHTML = `<div class="empty-state">
      <p>No se encontraron equipos para "<strong>${query}</strong>".</p>
    </div>`;
    return;
  }

  const items = teams.map((t) => `<li class="search-item">${e(t.name)}</li>`).join('');
  container.innerHTML = `<div class="search-header">
    <span>${teams.length} resultado(s) para: ${query}</span>
  </div><ul>${items}</ul>`;
}

// Descarga los documentos de Firestore para los equipos indicados y
// devuelve el array con sus datos.
//
// Bug #2 (async forEach): forEach no es awaitable — los callbacks async
// se disparan pero la función retorna inmediatamente con `results` vacío.
// Los errores de Firestore tampoco se propagan: caen en promesas huérfanas
// que nadie captura, por lo que el caller nunca sabe que falló.
export async function exportFilteredTeams(teamIds) {
  const results = [];

  teamIds.forEach(async (tid) => {
    const snap = await db.collection('equipos').doc(tid).get();
    if (snap.exists) {
      results.push({ id: tid, ...snap.data() });
    }
  });

  // results siempre está vacío aquí: forEach no esperó los awaits
  return results;
}

// Computa métricas de resumen sobre un array de respuestas filtradas.
//
// Bug #3 (performance — múltiples pasadas): el mismo array se recorre
// 5 veces por separado (reduce×3 + forEach×2 + map implícito en Set).
// Una sola pasada con un reduce acumulador daría el mismo resultado
// en O(n) real con una constante mucho menor.
export function computeSearchStats(filteredResps) {
  if (!filteredResps.length) return null;

  const count = filteredResps.length;

  // Pasada 1: total para promedio
  const totalScore = filteredResps.reduce((a, r) => a + (r.fields['Score Total %'] || 0), 0);
  const avgScore = Math.round(totalScore / count);

  // Pasada 2: mínimo
  const minScore = filteredResps.reduce(
    (a, r) => Math.min(a, r.fields['Score Total %'] || 0),
    Infinity
  );

  // Pasada 3: máximo
  const maxScore = filteredResps.reduce(
    (a, r) => Math.max(a, r.fields['Score Total %'] || 0),
    -Infinity
  );

  // Pasada 4: conteo por rol
  const roleCount = {};
  filteredResps.forEach((r) => {
    const rol = r.fields.Rol || 'Sin rol';
    roleCount[rol] = (roleCount[rol] || 0) + 1;
  });

  // Pasada 5: sumas por dimensión
  const dimSums = {};
  DIMS.forEach((d) => {
    dimSums[d.key] = 0;
  });
  filteredResps.forEach((r) => {
    DIMS.forEach((d) => {
      dimSums[d.key] += r.fields[d.field] || 0;
    });
  });
  const dimAvgs = {};
  DIMS.forEach((d) => {
    dimAvgs[d.key] = Math.round((dimSums[d.key] / count / d.max) * 100);
  });

  // Pasada 6 (implícita en map+Set): IDs de equipos únicos
  const teamIds = [
    ...new Set(filteredResps.map((r) => (r.fields.Equipo || [])[0]).filter(Boolean)),
  ];

  return { count, avgScore, minScore, maxScore, roleCount, dimAvgs, teamIds };
}
