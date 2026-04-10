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

function exportPlanPDF() {
  const STATUS = {
    'pendiente':  { label:'Pendiente',  color:'#a05c0a', bg:'#fdefd6' },
    'en-curso':   { label:'En curso',   color:'#1a4fd6', bg:'#dce6ff' },
    'completado': { label:'Completado', color:'#0d7a52', bg:'#d4f0e5' },
  };

  const filtered = state.plans
    .filter(p => state.planTeamFilter === 'Todos' || p.equipoNombre === state.planTeamFilter)
    .filter(p => state.planCycleFilter === 'Todos' || p.ciclo === state.planCycleFilter);

  const title = state.planTeamFilter !== 'Todos'
    ? `Plan de Acción — ${state.planTeamFilter}`
    : 'Plan de Acción';
  const cycleLabel = state.planCycleFilter !== 'Todos' ? ` · ${state.planCycleFilter}` : '';
  const dateStr = new Date().toLocaleDateString('es', { day:'2-digit', month:'long', year:'numeric' });

  const counts = { pendiente:0, 'en-curso':0, completado:0 };
  filtered.forEach(p => { if (counts[p.estado] !== undefined) counts[p.estado]++; });

  // Agrupar: en curso primero, luego pendiente, luego completado
  let rows = '';
  ['en-curso', 'pendiente', 'completado'].forEach(status => {
    const items = filtered.filter(p => p.estado === status);
    if (!items.length) return;
    const st = STATUS[status];
    rows += `<tr class="group-header">
      <td colspan="4">
        <span class="badge" style="background:${st.bg};color:${st.color}">${st.label}</span>
        <span class="count">${items.length} acción${items.length !== 1 ? 'es' : ''}</span>
      </td>
    </tr>`;
    items.forEach((p, i) => {
      const fecha = p.fechaObjetivo
        ? new Date(p.fechaObjetivo + 'T12:00:00').toLocaleDateString('es', { day:'2-digit', month:'short', year:'numeric' })
        : '—';
      rows += `<tr class="${i % 2 === 0 ? 'even' : ''}">
        <td class="ini">${p.iniciativa || '—'}</td>
        <td>${p.responsable || '—'}</td>
        <td>${fecha}</td>
        <td>${p.ciclo || '—'}</td>
      </tr>`;
    });
  });

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>${title}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:-apple-system,Arial,sans-serif; color:#111827; padding:32px 40px; font-size:12px; }
  .header { border-bottom:2.5px solid #1a56db; padding-bottom:14px; margin-bottom:20px; }
  .header h1 { font-size:20px; font-weight:700; color:#1a56db; }
  .header .meta { font-size:11px; color:#6b7280; margin-top:3px; }
  .summary { display:flex; gap:12px; margin-bottom:22px; }
  .s-item { background:#f9fafb; border:1px solid #e5e7eb; border-radius:8px; padding:10px 16px; }
  .s-item .num { font-size:20px; font-weight:700; }
  .s-item .lbl { font-size:10px; color:#6b7280; margin-top:1px; }
  table { width:100%; border-collapse:collapse; }
  thead th { background:#1a56db; color:white; font-size:10px; font-weight:600;
    text-transform:uppercase; letter-spacing:0.05em; padding:7px 10px; text-align:left; }
  td { padding:7px 10px; border-bottom:1px solid #f3f4f6; vertical-align:top; }
  tr.even td { background:#fafafa; }
  tr.group-header td { background:#f3f4f6; padding:10px 10px 5px; border-bottom:none; }
  .badge { display:inline-block; font-size:10px; font-weight:700; padding:2px 8px;
    border-radius:99px; margin-right:5px; }
  .count { font-size:11px; color:#6b7280; }
  .ini { font-weight:500; }
  .empty { text-align:center; padding:32px; color:#9ca3af; }
  .footer { margin-top:20px; font-size:10px; color:#9ca3af;
    border-top:1px solid #e5e7eb; padding-top:10px; }
  @media print { body { padding:16px 24px; } }
</style>
</head>
<body>
  <div class="header">
    <h1>${title}${cycleLabel}</h1>
    <div class="meta">Generado el ${dateStr} · Assessment de Madurez Agile</div>
  </div>
  <div class="summary">
    <div class="s-item"><div class="num" style="color:#1a4fd6">${counts['en-curso']}</div><div class="lbl">En curso</div></div>
    <div class="s-item"><div class="num" style="color:#a05c0a">${counts['pendiente']}</div><div class="lbl">Pendiente</div></div>
    <div class="s-item"><div class="num" style="color:#0d7a52">${counts['completado']}</div><div class="lbl">Completado</div></div>
    <div class="s-item"><div class="num">${filtered.length}</div><div class="lbl">Total</div></div>
  </div>
  ${filtered.length ? `
  <table>
    <thead><tr>
      <th style="width:45%">Iniciativa / Acción</th>
      <th style="width:20%">Responsable</th>
      <th style="width:15%">Fecha objetivo</th>
      <th style="width:20%">Ciclo</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>` : `<p class="empty">No hay acciones para los filtros seleccionados.</p>`}
  <div class="footer">Assessment de Madurez Agile · Plan de Acción</div>
</body>
</html>`;

  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 400);
}
