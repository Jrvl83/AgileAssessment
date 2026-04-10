// ── Export ───────────────────────────────────────────────────────
function downloadCSV(filename, rows) {
  const csv = 'sep=;\r\n' + '\uFEFF' + rows.map(r =>
    r.map(cell => '"' + String(cell == null ? '' : cell).replace(/"/g, '""') + '"').join(';')
  ).join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportSummary() {
  const headers = ['Equipo', 'Ciclo', 'Rol', 'Respuestas', 'Score Total %', 'Nivel',
    ...DIMS.map(d => d.label + ' %')];
  const rows = [headers];
  Object.values(state.teamStats).filter(s => s.count > 0).forEach(s => {
    const ds = getTeamFilteredStats(s.id, state.orgRoleFilter, state.cycleFilter);
    if (!ds) return;
    rows.push([s.name, state.cycleFilter === 'Todos' ? 'Todos' : state.cycleFilter,
      state.orgRoleFilter, ds.count, ds.avgTotal, ds.level.label,
      ...DIMS.map(d => ds.avgDims[d.key].pct)]);
  });
  downloadCSV(`resumen-assessment-${new Date().toISOString().slice(0,10)}.csv`, rows);
}

function exportRaw() {
  const headers = ['Fecha', 'Equipo', 'Participante', 'Rol', 'Ciclo', 'Tamaño Equipo', 'Tiempo Scrum',
    'Score Total %', 'Nivel', ...DIMS.map(d => d.label)];
  const rows = [headers];
  [...state.responses]
    .sort((a, b) => (a.fields.Fecha || '').localeCompare(b.fields.Fecha || ''))
    .forEach(r => {
      const team = state.teams.find(t => (r.fields.Equipo || []).includes(t.id));
      rows.push([
        r.fields.Fecha ? new Date(r.fields.Fecha).toLocaleDateString('es') : '',
        team ? team.name : '',
        r.fields.Participante || '',
        r.fields.Rol || '',
        r.fields.Ciclo || '',
        r.fields['Tamaño Equipo'] || '',
        r.fields['Tiempo Scrum'] || '',
        r.fields['Score Total %'] || 0,
        r.fields.Nivel || '',
        ...DIMS.map(d => r.fields[d.field] || 0)
      ]);
    });
  downloadCSV(`respuestas-assessment-${new Date().toISOString().slice(0,10)}.csv`, rows);
}

function exportPDF() { window.print(); }
